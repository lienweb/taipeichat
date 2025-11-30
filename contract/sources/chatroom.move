/// Module: chatroom
module taipeichat::chatroom {
    use std::string::String;
    use sui::{
        event,
        clock::Clock,
        dynamic_field as df,
        table::{Self, Table},
    };
    use taipeichat::profile::{Self, Profile, ProfileRegistry};

    // ===== Error Codes =====
    const ENotParticipant: u64 = 0;
    const EChatRoomNotFound: u64 = 1;
    const EEmptyMessage: u64 = 2;
    const ENoProfile: u64 = 3;
    const EProfileMismatch: u64 = 4;

    // ===== Structs =====

    /// Message key for dynamic field
    public struct MessageKey has store, copy, drop {
        index: u64,
    }

    /// Single message stored in dynamic field
    public struct Message has store {
        sender: address,
        username: String,
        content: String,
        timestamp: u64,
        profile_image: String,
    }

    /// Chatroom object
    public struct ChatRoom has key {
        id: UID,
        name: String,
        participants: vector<address>,
        participant_profiles: Table<address, ID>, // address -> Profile ID mapping for frontend
        created_at: u64,
        message_count: u64,  // next message index
    }

    // ===== Events =====

    public struct ChatRoomCreated has copy, drop {
        room_id: ID,
        name: String,
        creator: address,
        created_at: u64,
    }

    public struct MessageSent has copy, drop {
        room_id: ID,
        message_index: u64,
        sender: address,
        username: String,
        content: String,
        timestamp: u64,
    }

    public struct ParticipantJoined has copy, drop {
        room_id: ID,
        participant: address,
        username: String,
    }

    // ===== Public Functions =====

    /// create chatroom
    public fun create_chatroom(
        name: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let room = ChatRoom {
            id: object::new(ctx),
            name,
            participants: vector::empty(),
            participant_profiles: table::new(ctx),
            created_at: clock.timestamp_ms(),
            message_count: 0,
        };

        let room_id = object::id(&room);

        event::emit(ChatRoomCreated {
            room_id,
            name: room.name,
            creator: ctx.sender(),
            created_at: room.created_at,
        });

        transfer::share_object(room);
    }

    /// join chatroom
    public fun join_chatroom(
        room: &mut ChatRoom,
        registry: &ProfileRegistry,
        profile: &Profile,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        assert!(profile::owner(profile) == sender, EProfileMismatch);
        assert!(profile::has_profile(registry, sender), ENoProfile);
        
        if (!room.participants.contains(&sender)) {
            room.participants.push_back(sender);
            let profile_id = object::id(profile);
            table::add(&mut room.participant_profiles, sender, profile_id);
            
            event::emit(ParticipantJoined {
                room_id: object::id(room),
                participant: sender,
                username: profile::username(profile),
            });
        };
    }

    /// send message
    public fun send_message(
        room: &mut ChatRoom,
        registry: &ProfileRegistry,
        profile: &Profile,
        content: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        
        assert!(!content.is_empty(), EEmptyMessage);
        assert!(room.participants.contains(&sender), ENotParticipant);
        assert!(profile::owner(profile) == sender, EProfileMismatch);
        assert!(profile::has_profile(registry, sender), ENoProfile);

        let username = profile::username(profile);
        let profile_image = profile::image_blob_id(profile);

        // create message and store in dynamic field
        let timestamp = clock.timestamp_ms();
        let message = Message {
            sender,
            username,
            content,
            timestamp,
            profile_image,
        };

        let message_index = room.message_count;
        df::add(&mut room.id, MessageKey { index: message_index }, message);
        
        room.message_count = room.message_count + 1;

        event::emit(MessageSent {
            room_id: object::id(room),
            message_index,
            sender,
            username,
            content,
            timestamp,
        });
    }


    // ===== Getter Functions =====

    /// get participant's profile ID (for frontend to fetch Profile object)
    public fun get_participant_profile_id(room: &ChatRoom, addr: address): option::Option<ID> {
        if (table::contains(&room.participant_profiles, addr)) {
            option::some(*table::borrow(&room.participant_profiles, addr))
        } else {
            option::none()
        }
    }

    /// check if address is a participant
    public fun is_participant(room: &ChatRoom, addr: address): bool {
        room.participants.contains(&addr)
    }

    /// get specific message (need to know index)
    public fun get_message(room: &ChatRoom, index: u64): &Message {
        assert!(df::exists_(&room.id, MessageKey { index }), EChatRoomNotFound);
        df::borrow(&room.id, MessageKey { index })
    }

    /// check if message exists
    public fun has_message(room: &ChatRoom, index: u64): bool {
        df::exists_(&room.id, MessageKey { index })
    }
}




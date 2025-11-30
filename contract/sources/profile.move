/// Module: profile
module taipeichat::profile {
    use std::string::{Self, String};
    use sui::{
        event,
        clock::Clock,
        display,
        package,
        table::{Self, Table},
    };

    // ===== Error Codes =====

    const EProfileAlreadyExists: u64 = 0;
    const ENotProfileOwner: u64 = 1;
    const EImageRequired: u64 = 2;
    const EBioRequired: u64 = 3;

    // ===== Structs =====

    /// One-time witness
    public struct PROFILE has drop {}

    /// Profile NFT - represents a user
    public struct Profile has key {
        id: UID,
        owner: address,
        username: String,
        bio: String,
        image_blob_id: String, // Walrus blob id for profile image
        created_at: u64,
    }

    /// for chatroom list usage:: Global registry to track all profiles
    public struct ProfileRegistry has key {
        id: UID,
        profiles: Table<address, ID>, // address -> Profile object ID
        total_profiles: u64, // total number of profiles, can be used to count all visitors(V1)
    }

    // ===== Events =====

    public struct ProfileMinted has copy, drop {
        profile_id: ID,
        owner: address,
        username: String,
        bio: String,
        image_blob_id: String,
        created_at: u64,
    }

    public struct ImageUpdated has copy, drop {
        profile_id: ID,
        owner: address,
        image_blob_id: String,
    }

    public struct BioUpdated has copy, drop {
        profile_id: ID,
        owner: address,
        bio: String,
    }

    // ===== Init Function =====

    #[allow(lint(share_owned))]
    fun init(otw: PROFILE, ctx: &mut TxContext) {
        let registry = ProfileRegistry {
            id: object::new(ctx),
            profiles: table::new(ctx),
            total_profiles: 0,
        };
        transfer::share_object(registry);

        let publisher = package::claim(otw, ctx);
        let mut display = display::new<Profile>(&publisher, ctx);
        
        display.add(b"name".to_string(), b"Taipei Bootcamp Hackathon Profile 20251130 - {username}".to_string());
        display.add(b"description".to_string(), b"{bio}".to_string());
        display.add(b"image_url".to_string(), b"https://aggregator.walrus-testnet.walrus.space/v1/blobs/{image_blob_id}".to_string());
        display.add(b"project_url".to_string(), b"https://atrium.app".to_string()); // FIXME: add project url
        display.update_version();

        transfer::public_transfer(publisher, ctx.sender());
        transfer::public_transfer(display, ctx.sender());
    }

    // ===== Main Functions (For Client)=====

    /// Mint a new Profile NFT
    public fun mint_profile(
        registry: &mut ProfileRegistry,
        username: String,
        bio: String,
        image_blob_id: String,
        clock: &Clock,
        ctx: &mut TxContext
    ): Profile {
        let sender = ctx.sender();
        assert!(!registry.profiles.contains(sender), EProfileAlreadyExists);
        assert!(!string::is_empty(&image_blob_id), EImageRequired);

        let profile = Profile {
            id: object::new(ctx),
            owner: sender,
            username,
            bio,
            image_blob_id,
            created_at: clock.timestamp_ms(),
        };

        let profile_id = object::id(&profile);
        registry.profiles.add(sender, profile_id);
        registry.total_profiles = registry.total_profiles + 1;

        event::emit(ProfileMinted {
            profile_id,
            owner: sender,
            username: profile.username,
            bio: profile.bio,
            image_blob_id: profile.image_blob_id,
            created_at: profile.created_at,
        });

        profile
    }

    public fun update_image(
        profile: &mut Profile,
        image_blob_id: String,
        ctx: &TxContext
    ) {
        assert!(profile.owner == ctx.sender(), ENotProfileOwner);
        assert!(!string::is_empty(&image_blob_id), EImageRequired);
        profile.image_blob_id = image_blob_id;

        event::emit(ImageUpdated {
            profile_id: object::id(profile),
            owner: profile.owner,
            image_blob_id,
        });
    }

    public fun update_bio(
        profile: &mut Profile,
        bio: String,
        ctx: &TxContext
    ) {
        assert!(profile.owner == ctx.sender(), ENotProfileOwner);
        assert!(!string::is_empty(&bio), EBioRequired);
        profile.bio = bio;

        event::emit(BioUpdated {
            profile_id: object::id(profile),
            owner: profile.owner,
            bio,
        });
    }

    // ===== Getter Functions =====

    public fun get_profile_id(registry: &ProfileRegistry, addr: address): option::Option<ID> {
        if (registry.profiles.contains(addr)) {
            option::some(*registry.profiles.borrow(addr))
        } else {
            option::none()
        }
    }

    public fun has_profile(registry: &ProfileRegistry, addr: address): bool {
        registry.profiles.contains(addr)
    }

    public fun owner(profile: &Profile): address {
        profile.owner
    }

    public fun username(profile: &Profile): String {
        profile.username
    }

    public fun image_blob_id(profile: &Profile): String {
        profile.image_blob_id
    }
}




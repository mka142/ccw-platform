"""
Configuration management for piece configs
"""
from typing import List, Dict, Optional
import os
import json
from datetime import datetime
from db import Database


def print_header(text: str):
    """Print a formatted header"""
    print("\n" + "=" * 80)
    print(f" {text}")
    print("=" * 80)


def generate(
    db: Database,
    select_concerts_func,
    select_piece_func,
    select_users_for_piece_func
) -> Optional[Dict]:
    """Generate a piece configuration by selecting concerts, piece, and users"""
    print_header("Generate Piece Config")
    
    # Step 1: Select concerts
    concert_ids = select_concerts_func(db)
    if not concert_ids:
        print("No concerts selected. Cancelling config generation.")
        return None
    
    # Step 2: Select single piece
    piece_id = select_piece_func(db, concert_ids)
    if not piece_id:
        print("No piece selected. Cancelling config generation.")
        return None
    
    # Step 3: Select users for piece from each concert
    user_selections = select_users_for_piece_func(db, concert_ids, piece_id)
    if not user_selections:
        print("No users selected. Cancelling config generation.")
        return None
    
    # Step 4: Get config values per concert
    print_header("Config Defaults")
    
    # Get concert names for display
    concerts = db.list_concerts()
    concert_names = {c["id"]: c["name"] for c in concerts}
    
    # Interpolation method (global)
    interpolation_methods = ["linear", "step"]
    print("\nSelect interpolation method (applies to all concerts):")
    for i, method in enumerate(interpolation_methods, 1):
        print(f"  {i}. {method}")
    
    while True:
        method_input = input(f"\nSelect interpolation method (1-{len(interpolation_methods)}, default: 1): ").strip()
        if not method_input:
            interpolation_method = "linear"
            break
        try:
            method_num = int(method_input)
            if 1 <= method_num <= len(interpolation_methods):
                interpolation_method = interpolation_methods[method_num - 1]
                break
            else:
                print("Invalid choice. Try again.")
        except ValueError:
            print("Invalid input. Enter a number.")
    
    # Recording settings per concert
    print("\n" + "=" * 80)
    print(" Recording Settings (per concert)")
    print("=" * 80)
    
    recording_start_timestamps = {}
    recording_durations = {}
    resampling_ms = {}
    
    for concert_id in concert_ids:
        concert_name = concert_names.get(concert_id, f"Concert {concert_id[:8]}...")
        print(f"\nConcert: {concert_name} ({concert_id[:8]}...)")
        
        # Recording start timestamp
        while True:
            start_ts_input = input(f"  Recording start timestamp (default: 0): ").strip()
            if not start_ts_input:
                recording_start_timestamps[concert_id] = 0
                break
            try:
                recording_start_timestamps[concert_id] = float(start_ts_input)
                break
            except ValueError:
                print("  Invalid input. Enter a number.")
        
        # Recording duration
        while True:
            duration_input = input(f"  Recording duration in milliseconds (default: 0): ").strip()
            if not duration_input:
                recording_durations[concert_id] = 0
                break
            try:
                duration = float(duration_input)
                if duration >= 0:
                    recording_durations[concert_id] = duration
                    break
                else:
                    print("  Duration must be >= 0.")
            except ValueError:
                print("  Invalid input. Enter a number.")
        
        # Resampling window
        while True:
            resampling_input = input(f"  Resampling window in milliseconds (default: 1000): ").strip()
            if not resampling_input:
                resampling_ms[concert_id] = 1000
                break
            try:
                resampling = float(resampling_input)
                if resampling > 0:
                    resampling_ms[concert_id] = resampling
                    break
                else:
                    print("  Resampling window must be > 0.")
            except ValueError:
                print("  Invalid input. Enter a number.")
    
    # Build config
    config = {
        "concert_ids": concert_ids,
        "piece_id": piece_id,
        "users": user_selections,  # Dict mapping concert_id -> list of user_ids
        "recordingStartTimestamp": recording_start_timestamps,  # Dict mapping concert_id -> timestamp
        "recordingDuration": recording_durations,  # Dict mapping concert_id -> duration
        "resamplingMs": resampling_ms,  # Dict mapping concert_id -> resampling window
        "interpolationMethod": interpolation_method,
    }
    
    print("\n✓ Config generated successfully!")
    return config


def save(config: Dict, filename: Optional[str] = None) -> str:
    """Save config to JSON file"""
    if filename is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"output/piece_config_{timestamp}.json"
    
    # Ensure output directory exists
    output_dir = os.path.dirname(filename) if os.path.dirname(filename) else "output"
    os.makedirs(output_dir, exist_ok=True)
    
    with open(filename, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"✓ Config saved to: {filename}")
    return filename


def load(db: Database, filename: Optional[str] = None) -> Optional[Dict]:
    """Load config from JSON file with validation"""
    if filename is None:
        # Ask user to choose from list or provide path
        print("\nLoad config from:")
        print("  1. Choose from list")
        print("  2. Provide file path")
        
        while True:
            choice = input("\nSelect option (1-2): ").strip()
            if choice == "1":
                # List available config files
                config_dir = "output"
                if not os.path.exists(config_dir):
                    print(f"Config directory '{config_dir}' does not exist.")
                    return None
                
                config_files = [f for f in os.listdir(config_dir) if f.startswith("piece_config_") and f.endswith(".json")]
                
                if not config_files:
                    print("No config files found in output/ directory.")
                    return None
                
                print("\nAvailable config files:")
                for i, config_file in enumerate(config_files, 1):
                    print(f"  {i}. {config_file}")
                
                while True:
                    file_choice = input(f"\nSelect config file (1-{len(config_files)}): ").strip()
                    try:
                        choice_num = int(file_choice)
                        if 1 <= choice_num <= len(config_files):
                            filename = os.path.join(config_dir, config_files[choice_num - 1])
                            break
                        else:
                            print("Invalid choice. Try again.")
                    except ValueError:
                        print("Invalid input. Enter a number.")
                break
            elif choice == "2":
                filename = input("Enter config file path: ").strip()
                if not filename:
                    print("No path provided. Cancelling.")
                    return None
                break
            else:
                print("Invalid choice. Enter 1 or 2.")
    
    if not os.path.exists(filename):
        print(f"Config file '{filename}' does not exist.")
        return None
    
    try:
        with open(filename, 'r') as f:
            config = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error parsing config file: {e}")
        return None
    except Exception as e:
        print(f"Error loading config file: {e}")
        return None
    
    # Validate config
    print("\nValidating config...")
    validation_result = validate(db, config)
    
    if validation_result["warnings"]:
        print("\n⚠ Warnings:")
        for warning in validation_result["warnings"]:
            print(f"  - {warning}")
    
    if not validation_result["valid"]:
        print("\n✗ Config validation failed:")
        for error in validation_result["errors"]:
            print(f"  - {error}")
        return None
    
    # Build validated data structure
    validated_data = []
    concerts = db.list_concerts()
    concert_names = {c["id"]: c["name"] for c in concerts}
    
    for concert_id in config.get("concert_ids", []):
        concert_name = concert_names.get(concert_id, f"Concert {concert_id[:8]}...")
        user_ids = config.get("users", {}).get(concert_id, [])
        
        # Get config values (handle both old and new format)
        recording_start = config.get("recordingStartTimestamp", {})
        recording_duration = config.get("recordingDuration", {})
        resampling_ms = config.get("resamplingMs", {})
        
        if isinstance(recording_start, dict):
            start_ts = recording_start.get(concert_id, 0)
            duration = recording_duration.get(concert_id, 0)
            resampling = resampling_ms.get(concert_id, 50)
        else:
            # Old format - single values
            start_ts = recording_start if isinstance(recording_start, (int, float)) else 0
            duration = recording_duration if isinstance(recording_duration, (int, float)) else 0
            resampling = resampling_ms if isinstance(resampling_ms, (int, float)) else 50
        
        validated_data.append({
            "concert_id": concert_id,
            "concert_name": concert_name,
            "piece_id": config.get("piece_id"),
            "user_ids": user_ids,
            "recordingStartTimestamp": start_ts,
            "recordingDuration": duration,
            "resamplingMs": resampling,
            "interpolationMethod": config.get("interpolationMethod", "linear"),
        })
    
    print("\n✓ Config loaded and validated successfully!")
    return {
        "config": config,
        "validated_data": validated_data,
    }


def validate(db: Database, config: Dict) -> Dict:
    """Validate config: check concerts and users exist"""
    errors = []
    warnings = []
    
    # Get all available concerts
    available_concerts = db.list_concerts()
    available_concert_ids = {c["id"] for c in available_concerts}
    
    # Get all users
    all_users = db.users
    user_id_to_concert = {}
    for user in all_users:
        user_id = user.get("_id", {}).get("$oid", "")
        concert_id = user.get("concertId", {}).get("$oid", "")
        if user_id and concert_id:
            user_id_to_concert[user_id] = concert_id
    
    # Validate concerts
    concert_ids = config.get("concert_ids", [])
    if not concert_ids:
        errors.append("No concerts specified in config")
    else:
        for concert_id in concert_ids:
            if concert_id not in available_concert_ids:
                errors.append(f"Concert {concert_id[:8]}... does not exist in database")
    
    # Validate piece_id
    piece_id = config.get("piece_id")
    if not piece_id:
        errors.append("No piece_id specified in config")
    
    # Validate users
    users_config = config.get("users", {})
    if not users_config:
        errors.append("No users specified in config")
    else:
        for concert_id, user_ids in users_config.items():
            if concert_id not in available_concert_ids:
                continue  # Already reported as error above
            
            if not user_ids:
                warnings.append(f"Concert {concert_id[:8]}... has no users selected")
                continue
            
            # Check each user exists and belongs to the concert
            for user_id in user_ids:
                if user_id not in user_id_to_concert:
                    errors.append(f"User {user_id[:8]}... does not exist in database")
                elif user_id_to_concert[user_id] != concert_id:
                    errors.append(f"User {user_id[:8]}... does not belong to concert {concert_id[:8]}...")
    
    # Validate piece exists for each concert
    if piece_id and concert_ids:
        for concert_id in concert_ids:
            if concert_id in available_concert_ids:
                pieces = db.list_concert_pieces(concert_id)
                if piece_id not in pieces:
                    warnings.append(f"Piece '{piece_id}' not found in concert {concert_id[:8]}...")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }


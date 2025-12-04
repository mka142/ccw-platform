"""
Main script for concert statistics analysis
"""

from db import Database
from operations import resample_data, resample_data_with_period
import pandas as pd
import numpy as np
from scipy import stats
from typing import List, Dict, Optional
import matplotlib.pyplot as plt
import os
import json
from datetime import datetime
from utils import OptionSelector, create_user_custom_handler, create_user_exclude_handler
import config


def print_header(text: str):
    """Print a formatted header"""
    print("\n" + "=" * 80)
    print(f" {text}")
    print("=" * 80)


def select_concerts(db: Database) -> List[str]:
    """Interactive concert selection"""
    print_header("Concert Selection")

    concerts = db.list_concerts()

    if not concerts:
        print("No concerts found!")
        return []

    selector = OptionSelector(
        options=concerts,
        display_func=lambda concert, idx: f"  {idx}. {concert['name']} (ID: {concert['id'][:8]}...)",
        value_extractor=lambda concert: concert["id"],
        success_message_func=lambda concert: concert['name'],
        allow_all=True,
        prompt=f"\nSelect concert (1-{len(concerts)} or 'a' for ALL): ",
    )
    
    result = selector.select_multiple()
    # Override the generic "Selected: ALL" message with a more specific one
    if result and len(result) == len(concerts):
        print("Selected: ALL concerts")
    return result


def select_piece(db: Database, concert_ids: List[str]) -> Optional[str]:
    """Interactive single piece selection"""
    print_header("Piece Selection")

    all_pieces = set()
    for concert_id in concert_ids:
        pieces = db.list_concert_pieces(concert_id)
        all_pieces.update(pieces)

    pieces = sorted(list(all_pieces))

    if not pieces:
        print("No pieces found!")
        return None

    print(f"\nAvailable pieces ({len(pieces)} total):")
    
    selector = OptionSelector(
        options=pieces,
        display_func=lambda piece, idx: f"  {idx}. {piece}",
        value_extractor=lambda piece: piece,
        success_message_func=lambda piece: piece,
        allow_all=False,  # Only single selection
        prompt=f"\nSelect piece (1-{len(pieces)}): ",
        max_display=10,
    )
    
    result = selector.select_single()
    return result


def select_users_for_piece(
    db: Database, concert_ids: List[str], piece_id: str
) -> Dict[str, List[str]]:
    """Interactive user selection per concert for a single piece"""
    print_header("User Selection")

    result = {}

    concerts = db.list_concerts()

    for concert_id in concert_ids:
        users = db.list_concert_piece_users(concert_id, piece_id)

        concert_name = next(f'{concert["name"]} {concert["id"][:8]}...' for concert in concerts if concert["id"] == concert_id)

        if not users:
            print(f"\nConcert: {concert_name}, Piece: {piece_id}")
            print("No users found for this concert/piece combination")
            continue

        print(f"\nConcert: {concert_name}, Piece: {piece_id}")
        print(f"Found {len(users)} users")

        # Create handlers for custom and exclude options
        custom_handler = create_user_custom_handler(id_key="id")
        exclude_handler = create_user_exclude_handler(id_key="id")
        
        selector = OptionSelector(
            options=users,
            display_func=lambda user, idx: f"  {idx}. User {user['id'][:8]}... ({user['deviceType']})",
            value_extractor=lambda user: user["id"],
            success_message_func=lambda user: f"{user['id'][:8]}...",
            allow_all=True,
            special_keys={
                'c': {
                    'label': 'CUSTOM selection (provide list)',
                    'handler': custom_handler
                },
                'e': {
                    'label': 'EXCLUDE users (from all)',
                    'handler': exclude_handler
                }
            },
            prompt=f"Select users (1-{len(users)} or 'a'/'c'/'e'): ",
            max_display=5,
        )
        
        selected_ids = selector.select_multiple()
        if selected_ids:
            result[concert_id] = selected_ids

    return result




def apply_resampling(
    db: Database,
    validated_data: List[Dict]
) -> Optional[List[Dict]]:
    """
    Apply resampling to all validated data
    
    Args:
        db: Database instance
        validated_data: List of validated concert data dictionaries
        
    Returns:
        List of resampled data per concert with user data
    """
    print_header("Applying Resampling")
    
    resampled_results = []
    
    for concert_data in validated_data:
        concert_id = concert_data['concert_id']
        concert_name = concert_data['concert_name']
        piece_id = concert_data['piece_id']
        user_ids = concert_data['user_ids']
        recording_start = concert_data['recordingStartTimestamp']
        recording_duration = concert_data['recordingDuration']
        resampling_ms = concert_data['resamplingMs']
        interpolation_method = concert_data['interpolationMethod']
        
        print(f"\nProcessing: {concert_name} ({concert_id[:8]}...)")
        print(f"  Piece: {piece_id}")
        print(f"  Users: {len(user_ids)}")
        print(f"  Period: {recording_start} to {recording_start + recording_duration} ms")
        print(f"  Resampling window: {resampling_ms} ms")
        print(f"  Interpolation: {interpolation_method}")
        
        # Calculate expected number of samples
        from operations import adjust_duration_to_resampling_window
        adjusted_duration, num_samples = adjust_duration_to_resampling_window(
            recording_duration, resampling_ms
        )
        
        if adjusted_duration != recording_duration:
            print(f"  ⚠ Duration adjusted: {recording_duration} → {adjusted_duration} ms")
        
        print(f"  Expected samples per user: {num_samples}")
        
        # Process each user
        user_resampled_data = {}
        users_processed = 0
        users_failed = 0
        
        for user_id in user_ids:
            # Get forms for this user
            forms = db.get_forms_for_concert_piece_user(concert_id, piece_id, user_id)
            
            if not forms:
                print(f"    ⚠ User {user_id[:8]}...: No forms found")
                users_failed += 1
                continue
            
            # Prepare data for resampling
            data = [
                {'timestamp': form['timestamp'], 'value': form['value']}
                for form in forms
            ]
            
            try:
                # Apply resampling
                resampled = resample_data_with_period(
                    data=data,
                    recording_start_timestamp=recording_start,
                    recording_duration=recording_duration,
                    resampling_ms=resampling_ms,
                    interpolation_method=interpolation_method
                )
                
                
                # Verify we got the expected number of samples
                if len(resampled) != num_samples:
                    print(f"    ⚠ User {user_id[:8]}...: Expected {num_samples} samples, got {len(resampled)}")
                
                user_resampled_data[user_id] = resampled
                users_processed += 1
                
            except Exception as e:
                print(f"    ✗ User {user_id[:8]}...: Resampling failed - {e}")
                users_failed += 1
                continue
        
        print(f"  ✓ Processed: {users_processed} users, Failed: {users_failed} users")
        
        # Store results for this concert
        resampled_results.append({
            'concert_id': concert_id,
            'concert_name': concert_name,
            'piece_id': piece_id,
            'recording_start': recording_start,
            'recording_duration': adjusted_duration,
            'resampling_ms': resampling_ms,
            'interpolation_method': interpolation_method,
            'expected_samples': num_samples,
            'users': user_resampled_data,
        })
    
    return resampled_results


def plot_user_response(
    user_data: List[Dict[str, float]],
    concert_name: str,
    user_id: str,
    output_dir: str = 'output'
) -> str:
    """
    Generate a plot for a single user's response data over time
    
    Args:
        user_data: List of dictionaries with 'time' and 'value' keys
        concert_name: Name of the concert (for plot title)
        user_id: User ID (for plot title and filename)
        output_dir: Directory to save the plot
        
    Returns:
        Path to the saved plot file
    """
    if len(user_data) == 0:
        raise ValueError("No data provided for plotting")
    
    # Extract time and value data
    times = [point.get('time', 0) for point in user_data]
    values = [point.get('value', 0) for point in user_data]
    
    # Create figure
    fig, ax = plt.subplots(figsize=(12, 6))
    
    # Plot value over time
    ax.plot(times, values, linewidth=2, alpha=0.7, color='steelblue', marker='o', markersize=3)
    
    # Formatting
    ax.set_xlabel('Time (ms)', fontsize=12)
    ax.set_ylabel('Value', fontsize=12)
    ax.set_title(f"{concert_name}\nUser: {user_id[:8]}...", fontsize=14, fontweight='bold')
    ax.grid(True, alpha=0.3)
    
    # Add statistics text
    mean_val = np.mean(values)
    std_val = np.std(values)
    min_val = np.min(values)
    max_val = np.max(values)
    stats_text = f'Mean: {mean_val:.2f}, Std: {std_val:.2f}\nMin: {min_val:.2f}, Max: {max_val:.2f}'
    ax.text(0.02, 0.98, stats_text, transform=ax.transAxes,
            fontsize=10, verticalalignment='top',
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
    
    plt.tight_layout()
    
    # Save plot
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe_concert_name = "".join(c for c in concert_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
    safe_concert_name = safe_concert_name.replace(' ', '_')[:30]  # Limit length
    filename = f'user_response_{safe_concert_name}_{user_id[:8]}_{timestamp}.png'
    output_path = os.path.join(output_dir, filename)
    
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()
    
    return output_path


def show_main_menu() -> str:
    """Display main menu and return selected option"""
    print_header("Main Menu")
    
    options = [
        ("Generate piece config", "generate"),
        ("Load config", "load"),
    ]
    
    print("\nAvailable options:")
    selector = OptionSelector(
        options=options,
        display_func=lambda opt, idx: f"  {idx}. {opt[0]}",
        value_extractor=lambda opt: opt[1],
        success_message_func=lambda opt: opt[0],
        allow_all=False,
        prompt=f"\nSelect option (1-{len(options)}): ",
    )
    
    return selector.select_single()


def main():
    """Main function for statistical analysis"""

    print_header("Concert Statistics Analysis Tool")
    print("\nThis tool allows you to perform statistical analysis")
    print("on concert form data.")

    # Initialize database
    db = Database()

    # Main menu loop
    while True:
        choice = show_main_menu()
        
        if choice == "generate":
            # Generate config
            cfg = config.generate(
                db,
                select_concerts,
                select_piece,
                select_users_for_piece
            )
            if cfg:
                config.save(cfg)
                # After generating, proceed to load it
                print("\nProceeding to load the generated config...")
                choice = "load"
            else:
                print("\nConfig generation cancelled.")
                continue
        
        if choice == "load":
            # Load config
            result = config.load(db)
            if result:
                cfg = result["config"]
                validated_data = result["validated_data"]
                
                print("\n" + "=" * 80)
                print(" Config Summary")
                print("=" * 80)
                print(f"  Piece ID: {cfg.get('piece_id', 'N/A')}")
                print(f"  Concerts: {len(validated_data)}")
                total_users = sum(len(data['user_ids']) for data in validated_data)
                print(f"  Total users: {total_users}")
                print(f"  Interpolation method: {cfg.get('interpolationMethod', 'N/A')}")
                
                print("\n  Concert details:")
                for data in validated_data:
                    print(f"    - {data['concert_name']} ({data['concert_id'][:8]}...)")
                    print(f"      Users: {len(data['user_ids'])}")
                    print(f"      Start: {data['recordingStartTimestamp']}, Duration: {data['recordingDuration']} ms")
                    print(f"      Resampling: {data['resamplingMs']} ms")
                
                # Apply resampling to all data
                resampled_data = apply_resampling(db, validated_data)
                    
                
                break
            else:
                print("\nConfig loading cancelled or failed.")
                continue
        
        if choice is None:
            print("\nExiting...")
            break

    print_header("Analysis Complete")


if __name__ == "__main__":
    main()

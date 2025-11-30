"""
Main script for concert statistics analysis
"""

from db import Database
from operations import resample_data
import pandas as pd
import numpy as np
from scipy import stats
from typing import List, Dict


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

    print("\nAvailable concerts:")
    for i, concert in enumerate(concerts, 1):
        print(f"  {i}. {concert['name']} (ID: {concert['id'][:8]}...)")
    print(f"  {len(concerts) + 1}. ALL concerts")

    while True:
        choice = input(f"\nSelect concert (1-{len(concerts) + 1}): ").strip()
        try:
            choice_num = int(choice)
            if 1 <= choice_num <= len(concerts):
                selected = [concerts[choice_num - 1]["id"]]
                print(f"Selected: {concerts[choice_num - 1]['name']}")
                return selected
            elif choice_num == len(concerts) + 1:
                print("Selected: ALL concerts")
                return [c["id"] for c in concerts]
            else:
                print("Invalid choice. Try again.")
        except ValueError:
            print("Invalid input. Enter a number.")


def select_pieces(db: Database, concert_ids: List[str]) -> List[str]:
    """Interactive piece selection"""
    print_header("Piece Selection")

    all_pieces = set()
    for concert_id in concert_ids:
        pieces = db.list_concert_pieces(concert_id)
        all_pieces.update(pieces)

    pieces = sorted(list(all_pieces))

    if not pieces:
        print("No pieces found!")
        return []

    print(f"\nAvailable pieces ({len(pieces)} total):")
    for i, piece in enumerate(pieces[:10], 1):
        print(f"  {i}. {piece}")
    if len(pieces) > 10:
        print(f"  ... and {len(pieces) - 10} more")
    print(f"  {len(pieces) + 1}. ALL pieces")

    while True:
        choice = input(f"\nSelect piece (1-{len(pieces) + 1}): ").strip()
        try:
            choice_num = int(choice)
            if 1 <= choice_num <= len(pieces):
                selected = [pieces[choice_num - 1]]
                print(f"Selected: {pieces[choice_num - 1]}")
                return selected
            elif choice_num == len(pieces) + 1:
                print("Selected: ALL pieces")
                return pieces
            else:
                print("Invalid choice. Try again.")
        except ValueError:
            print("Invalid input. Enter a number.")


def select_users(
    db: Database, concert_ids: List[str], piece_ids: List[str]
) -> Dict[str, List[str]]:
    """Interactive user selection per concert and piece"""
    print_header("User Selection")

    result = {}

    for concert_id in concert_ids:
        for piece_id in piece_ids:
            users = db.list_concert_piece_users(concert_id, piece_id)

            if not users:
                continue

            key = f"{concert_id}_{piece_id}"

            print(f"\nConcert: {concert_id[:8]}..., Piece: {piece_id}")
            print(f"Found {len(users)} users")

            for i, user in enumerate(users[:5], 1):
                print(f"  {i}. User {user['id'][:8]}... " f"({user['deviceType']})")
            if len(users) > 5:
                print(f"  ... and {len(users) - 5} more")
            print(f"  {len(users) + 1}. ALL users")
            print(f"  {len(users) + 2}. CUSTOM selection (provide list)")
            print(f"  {len(users) + 3}. EXCLUDE users (from all)")

            while True:
                choice = input(
                    f"Select users (1-{len(users) + 3}): "
                ).strip()
                try:
                    choice_num = int(choice)
                    if 1 <= choice_num <= len(users):
                        result[key] = [users[choice_num - 1]["id"]]
                        print(f"Selected: {users[choice_num - 1]['id'][:8]}...")
                        break
                    elif choice_num == len(users) + 1:
                        result[key] = [u["id"] for u in users]
                        print(f"Selected: ALL {len(users)} users")
                        break
                    elif choice_num == len(users) + 2:
                        # Custom list of IDs
                        print("\nEnter user IDs (comma-separated):")
                        print("You can use full IDs or first 8 characters")
                        custom_input = input("IDs: ").strip()
                        
                        if not custom_input:
                            print("No IDs provided. Try again.")
                            continue
                        
                        # Parse input
                        input_ids = [
                            id.strip() for id in custom_input.split(",")
                        ]
                        
                        # Match IDs (support partial matching)
                        matched_users = []
                        for input_id in input_ids:
                            for user in users:
                                if (user["id"] == input_id or 
                                    user["id"].startswith(input_id)):
                                    if user["id"] not in matched_users:
                                        matched_users.append(user["id"])
                                    break
                        
                        if matched_users:
                            result[key] = matched_users
                            print(f"Selected: {len(matched_users)} users")
                            for uid in matched_users:
                                print(f"  - {uid[:8]}...")
                            break
                        else:
                            print("No matching users found. Try again.")
                    elif choice_num == len(users) + 3:
                        # Exclude users
                        print("\nEnter user IDs to EXCLUDE (comma-separated):")
                        print("You can use full IDs or first 8 characters")
                        exclude_input = input("IDs to exclude: ").strip()
                        
                        if not exclude_input:
                            # No exclusions, use all
                            result[key] = [u["id"] for u in users]
                            print(f"No exclusions. Selected: ALL {len(users)} users")
                            break
                        
                        # Parse exclusion list
                        exclude_ids = [
                            id.strip() for id in exclude_input.split(",")
                        ]
                        
                        # Match exclusion IDs
                        excluded_users = set()
                        for exclude_id in exclude_ids:
                            for user in users:
                                if (user["id"] == exclude_id or 
                                    user["id"].startswith(exclude_id)):
                                    excluded_users.add(user["id"])
                                    break
                        
                        # Get remaining users
                        remaining_users = [
                            u["id"] for u in users 
                            if u["id"] not in excluded_users
                        ]
                        
                        if remaining_users:
                            result[key] = remaining_users
                            print(f"Excluded: {len(excluded_users)} users")
                            print(f"Selected: {len(remaining_users)} users")
                            break
                        else:
                            print("All users would be excluded. Try again.")
                    else:
                        print("Invalid choice. Try again.")
                except ValueError:
                    print("Invalid input. Enter a number.")

    return result


def run_spearman_correlation_test(
    db: Database,
    concert_ids: List[str],
    piece_ids: List[str],
    user_selections: Dict[str, List[str]],
    window_ms: float = 1000,
):
    """
    Run Spearman rank correlation test
    Rows: resampled time points
    Columns: users
    """
    print_header("Spearman Rank Correlation Test")

    for concert_id in concert_ids:
        for piece_id in piece_ids:
            key = f"{concert_id}_{piece_id}"

            if key not in user_selections:
                continue

            user_ids = user_selections[key]

            if len(user_ids) < 2:
                print(f"\nSkipping {piece_id}: need at least 2 users")
                continue

            print(f"\n{'='*80}")
            print(f"Concert: {concert_id[:8]}...")
            print(f"Piece: {piece_id}")
            print(f"Users: {len(user_ids)}")

            # Collect data for all users
            user_data = {}

            for user_id in user_ids:
                forms = db.get_forms_for_concert_piece_user(
                    concert_id, piece_id, user_id
                )

                if not forms:
                    continue

                # Prepare and resample data
                data = [
                    {"timestamp": form["timestamp"], "value": form["value"]}
                    for form in forms
                ]

                resampled = resample_data(
                    data, window_ms=window_ms, interpolation_method="linear"
                )

                user_data[user_id] = resampled

            if len(user_data) < 2:
                print(f"Not enough users with data: {len(user_data)}")
                continue

            # Find common timestamp range
            all_timestamps = set()
            for user_id, data in user_data.items():
                all_timestamps.update([d["timestamp"] for d in data])

            common_timestamps = sorted(list(all_timestamps))

            # Build matrix: rows = timestamps, columns = users
            matrix = []
            user_list = list(user_data.keys())
            
            print(f"Building data matrix for {len(common_timestamps)} timestamps")

            for timestamp in common_timestamps:
                row = []
                for user_id in user_list:
                    # Find value at this timestamp
                    value = None
                    for point in user_data[user_id]:
                        if point["timestamp"] == timestamp:
                            value = point["value"]
                            break

                    if value is not None:
                        row.append(value)
                    else:
                        row.append(np.nan)

                # Only include row if at least 2 non-NaN values
                if sum(1 for v in row if not np.isnan(v)) >= 2:
                    matrix.append(row)

            if len(matrix) < 2:
                print(f"Not enough common data points: {len(matrix)}")
                continue

            # Convert to DataFrame for analysis
            df = pd.DataFrame(matrix, columns=[f"User_{uid[:8]}" for uid in user_list])

            print(f"\nData matrix shape: {df.shape}")
            print(f"Samples (rows): {df.shape[0]}")
            print(f"Users (columns): {df.shape[1]}")

            # Calculate Spearman correlation matrix
            print("\nCalculating Spearman rank correlation...")

            # Remove columns with all NaN
            df_clean = df.dropna(axis=1, how="all")

            if df_clean.shape[1] < 2:
                print("Not enough users with complete data")
                continue

            # Calculate correlation matrix
            corr_matrix, p_values = calculate_spearman_matrix(df_clean)

            print("\n" + "-" * 80)
            print("Spearman Rank Correlation Matrix:")
            print("-" * 80)
            print(corr_matrix.to_string())

            print("\n" + "-" * 80)
            print("P-values:")
            print("-" * 80)
            print(p_values.to_string())

            # Summary statistics
            print("\n" + "-" * 80)
            print("Summary Statistics:")
            print("-" * 80)

            # Get upper triangle values (excluding diagonal)
            upper_tri = np.triu_indices_from(corr_matrix.values, k=1)
            correlations = corr_matrix.values[upper_tri]
            p_vals = p_values.values[upper_tri]

            # Remove NaN values for statistics
            valid_corr = correlations[~np.isnan(correlations)]
            valid_p = p_vals[~np.isnan(p_vals)]

            if len(valid_corr) > 0:
                print(f"Mean correlation: {np.mean(valid_corr):.4f}")
                print(f"Median correlation: {np.median(valid_corr):.4f}")
                print(f"Std correlation: {np.std(valid_corr):.4f}")
                print(f"Min correlation: {np.min(valid_corr):.4f}")
                print(f"Max correlation: {np.max(valid_corr):.4f}")

                # Count significant correlations (p < 0.05)
                significant = np.sum(valid_p < 0.05)
                total = len(valid_p)
                print(
                    f"\nSignificant correlations (p < 0.05): "
                    f"{significant}/{total} "
                    f"({100*significant/total:.1f}%)"
                )
            else:
                print("No valid correlations to analyze")


def calculate_spearman_matrix(df: pd.DataFrame):
    """Calculate Spearman correlation matrix with p-values"""
    n_cols = df.shape[1]
    corr_matrix = np.zeros((n_cols, n_cols))
    p_matrix = np.zeros((n_cols, n_cols))

    for i in range(n_cols):
        for j in range(n_cols):
            if i == j:
                corr_matrix[i, j] = 1.0
                p_matrix[i, j] = 0.0
            else:
                # Remove NaN pairs
                mask = ~(df.iloc[:, i].isna() | df.iloc[:, j].isna())
                x = df.iloc[:, i][mask]
                y = df.iloc[:, j][mask]

                if len(x) >= 3:  # Need at least 3 points
                    corr, p_val = stats.spearmanr(x, y)
                    corr_matrix[i, j] = corr
                    p_matrix[i, j] = p_val
                else:
                    corr_matrix[i, j] = np.nan
                    p_matrix[i, j] = np.nan

    corr_df = pd.DataFrame(corr_matrix, index=df.columns, columns=df.columns)
    p_df = pd.DataFrame(p_matrix, index=df.columns, columns=df.columns)

    return corr_df, p_df


def run_statistics_info(
    db: Database,
    concert_ids: List[str],
    piece_ids: List[str],
    user_selections: Dict[str, List[str]],
):
    """
    Display statistical information about concerts, pieces, and users
    """
    print_header("Concert Statistics Info")

    for concert_id in concert_ids:
        # Get concert info
        concerts = db.list_concerts()
        concert_info = next(
            (c for c in concerts if c["id"] == concert_id), None
        )

        if not concert_info:
            continue

        print(f"\n{'='*80}")
        print(f"CONCERT: {concert_info['name']}")
        print(f"ID: {concert_id}")
        print(f"Created: {concert_info.get('createdAt', 'N/A')}")
        print(f"Active: {concert_info.get('isActive', False)}")
        print("=" * 80)

        # Get all pieces for this concert
        all_concert_pieces = db.list_concert_pieces(concert_id)

        print(f"\nTotal unique pieces in concert: {len(all_concert_pieces)}")

        # Get all users for this concert across all pieces
        all_concert_users = set()
        for piece_id in all_concert_pieces:
            users = db.list_concert_piece_users(concert_id, piece_id)
            all_concert_users.update([u["id"] for u in users])

        print(f"Total unique users in concert: {len(all_concert_users)}")

        # Get total forms for this concert
        df_concert = db.get_forms_dataframe(concert_id=concert_id)
        print(f"Total forms submitted: {len(df_concert)}")

        if not df_concert.empty:
            print(f"\nValue statistics across all pieces:")
            print(f"  Mean: {df_concert['value'].mean():.2f}")
            print(f"  Median: {df_concert['value'].median():.2f}")
            print(f"  Std: {df_concert['value'].std():.2f}")
            print(f"  Min: {df_concert['value'].min():.2f}")
            print(f"  Max: {df_concert['value'].max():.2f}")

        # Now show info for each piece
        print(f"\n{'-'*80}")
        print("PIECES BREAKDOWN:")
        print("-" * 80)

        # Filter to requested pieces
        pieces_to_show = [p for p in all_concert_pieces if p in piece_ids]

        for piece_id in pieces_to_show:
            key = f"{concert_id}_{piece_id}"

            print(f"\nPiece: {piece_id}")
            print("-" * 40)

            # Get users for this piece
            piece_users = db.list_concert_piece_users(concert_id, piece_id)

            # If user selection exists for this combo, use it
            if key in user_selections:
                selected_user_ids = user_selections[key]
                print(f"Total users: {len(piece_users)}")
                print(f"Selected users: {len(selected_user_ids)}")
            else:
                selected_user_ids = [u["id"] for u in piece_users]
                print(f"Total users: {len(selected_user_ids)}")

            # Get forms for this piece
            df_piece = db.get_forms_dataframe(
                concert_id=concert_id, piece_id=piece_id
            )

            # Filter to selected users if specified
            if key in user_selections:
                df_piece = df_piece[
                    df_piece["client_id"].isin(selected_user_ids)
                ]

            if not df_piece.empty:
                print(f"Total forms: {len(df_piece)}")
                print(f"\nValue statistics:")
                print(f"  Mean: {df_piece['value'].mean():.2f}")
                print(f"  Median: {df_piece['value'].median():.2f}")
                print(f"  Std: {df_piece['value'].std():.2f}")
                print(f"  Min: {df_piece['value'].min():.2f}")
                print(f"  Max: {df_piece['value'].max():.2f}")

                # Time range
                if "timestamp" in df_piece.columns:
                    time_range = (
                        df_piece["timestamp"].max() - 
                        df_piece["timestamp"].min()
                    )
                    time_range_seconds = (
                        time_range.total_seconds()
                        if hasattr(time_range, "total_seconds")
                        else 0
                    )
                    print(f"\nTime range: {time_range_seconds:.1f} seconds")

                # Forms per user statistics
                forms_per_user = df_piece.groupby("client_id").size()
                print(f"\nForms per user:")
                print(f"  Mean: {forms_per_user.mean():.1f}")
                print(f"  Median: {forms_per_user.median():.1f}")
                print(f"  Min: {forms_per_user.min()}")
                print(f"  Max: {forms_per_user.max()}")

                # Device type breakdown if available
                if key in user_selections:
                    device_types = {}
                    for user in piece_users:
                        if user["id"] in selected_user_ids:
                            device = user.get("deviceType", "Unknown")
                            device_types[device] = (
                                device_types.get(device, 0) + 1
                            )

                    if device_types:
                        print(f"\nDevice types:")
                        for device, count in sorted(device_types.items()):
                            print(f"  {device}: {count} users")
            else:
                print("No forms found for this piece")


def select_test():
    """Interactive test selection"""
    print_header("Test Selection")

    tests = [
        ("Statistics Info", "stats"),
        ("Spearman Rank Correlation", "spearman"),
    ]

    print("\nAvailable tests:")
    for i, (name, _) in enumerate(tests, 1):
        print(f"  {i}. {name}")

    while True:
        choice = input(f"\nSelect test (1-{len(tests)}): ").strip()
        try:
            choice_num = int(choice)
            if 1 <= choice_num <= len(tests):
                test_name, test_id = tests[choice_num - 1]
                print(f"Selected: {test_name}")
                return test_id
            else:
                print("Invalid choice. Try again.")
        except ValueError:
            print("Invalid input. Enter a number.")


def main():
    """Main function for statistical analysis"""

    print_header("Concert Statistics Analysis Tool")
    print("\nThis tool allows you to perform statistical analysis")
    print("on concert form data.")

    # Initialize database
    db = Database()

    # Step 1: Select concerts
    concert_ids = select_concerts(db)
    if not concert_ids:
        print("No concerts selected. Exiting.")
        return

    # Step 2: Select pieces
    piece_ids = select_pieces(db, concert_ids)
    if not piece_ids:
        print("No pieces selected. Exiting.")
        return

    # Step 3: Select users
    user_selections = select_users(db, concert_ids, piece_ids)
    if not user_selections:
        print("No users selected. Exiting.")
        return

    # Step 4: Select test
    test_id = select_test()

    # Step 5: Run test
    if test_id == "stats":
        # Run statistics info (no resampling needed)
        run_statistics_info(db, concert_ids, piece_ids, user_selections)
    elif test_id == "spearman":
        # Ask for resampling window
        print_header("Resampling Configuration")
        while True:
            window_input = input(
                "\nResample window in milliseconds (default: 1000): "
            ).strip()
            if not window_input:
                window_ms = 1000
                break
            try:
                window_ms = float(window_input)
                if window_ms > 0:
                    break
                else:
                    print("Window must be positive.")
            except ValueError:
                print("Invalid input. Enter a number.")

        run_spearman_correlation_test(
            db, concert_ids, piece_ids, user_selections, window_ms
        )

    print_header("Analysis Complete")


if __name__ == "__main__":
    main()

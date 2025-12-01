"""
Main script for concert statistics analysis
"""

from db import Database
from operations import resample_data
import pandas as pd
import numpy as np
from scipy import stats
from typing import List, Dict
import matplotlib.pyplot as plt
import os
from datetime import datetime


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
    print(f"  a. ALL concerts")

    while True:
        choice = input(f"\nSelect concert (1-{len(concerts)} or 'a' for ALL): ").strip().lower()
        if choice == 'a':
            print("Selected: ALL concerts")
            return [c["id"] for c in concerts]
        try:
            choice_num = int(choice)
            if 1 <= choice_num <= len(concerts):
                selected = [concerts[choice_num - 1]["id"]]
                print(f"Selected: {concerts[choice_num - 1]['name']}")
                return selected
            else:
                print("Invalid choice. Try again.")
        except ValueError:
            print("Invalid input. Enter a number or 'a' for ALL.")


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
    print(f"  a. ALL pieces")

    while True:
        choice = input(f"\nSelect piece (1-{len(pieces)} or 'a' for ALL): ").strip().lower()
        if choice == 'a':
            print("Selected: ALL pieces")
            return pieces
        try:
            choice_num = int(choice)
            if 1 <= choice_num <= len(pieces):
                selected = [pieces[choice_num - 1]]
                print(f"Selected: {pieces[choice_num - 1]}")
                return selected
            else:
                print("Invalid choice. Try again.")
        except ValueError:
            print("Invalid input. Enter a number or 'a' for ALL.")


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
            print(f"  a. ALL users")
            print(f"  c. CUSTOM selection (provide list)")
            print(f"  e. EXCLUDE users (from all)")

            while True:
                choice = input(
                    f"Select users (1-{len(users)} or 'a'/'c'/'e'): "
                ).strip().lower()
                
                if choice == 'a':
                        result[key] = [u["id"] for u in users]
                        print(f"Selected: ALL {len(users)} users")
                        break
                elif choice == 'c':
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
                        continue
                elif choice == 'e':
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
                        continue
                else:
                    # Try to parse as number for individual user selection
                    try:
                        choice_num = int(choice)
                        if 1 <= choice_num <= len(users):
                            result[key] = [users[choice_num - 1]["id"]]
                            print(f"Selected: {users[choice_num - 1]['id'][:8]}...")
                            break
                        else:
                            print("Invalid choice. Try again.")
                    except ValueError:
                        print("Invalid input. Enter a number (1-{}) or 'a'/'c'/'e'.".format(len(users)))

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


def run_value_histogram_analysis(
    db: Database,
    concert_ids: List[str],
    piece_ids: List[str],
    user_selections: Dict[str, List[str]],
):
    """
    Create histograms of values for each piece with normal distribution overlay
    and test for normality
    """
    print_header("Value Histogram Analysis with Normal Distribution")

    # Collect all pieces data
    all_piece_data = {}
    normality_results = {}
    
    # Get concert names for display
    concerts = db.list_concerts()
    concert_names = {c["id"]: c["name"] for c in concerts}

    for concert_id in concert_ids:
        for piece_id in piece_ids:
            key = f"{concert_id}_{piece_id}"

            if key not in user_selections:
                continue

            user_ids = user_selections[key]

            # Get forms for this piece
            df_piece = db.get_forms_dataframe(
                concert_id=concert_id, piece_id=piece_id
            )

            # Filter to selected users if specified
            if key in user_selections:
                df_piece = df_piece[
                    df_piece["client_id"].isin(user_ids)
                ]

            if df_piece.empty:
                print(f"\nSkipping {piece_id}: no data found")
                continue

            # Extract values (range 0-100, will be aggregated into 10 buckets)
            values = df_piece['value'].values

            # Filter values to 0-100 range
            values = values[(values >= 0) & (values <= 100)]

            if len(values) == 0:
                print(f"\nSkipping {piece_id}: no values in range 0-100")
                continue

            # Store data for this piece
            piece_key = f"{concert_id}_{piece_id}"
            all_piece_data[piece_key] = {
                'values': values,
                'concert_id': concert_id,
                'concert_name': concert_names.get(concert_id, f"Concert {concert_id[:8]}..."),
                'piece_id': piece_id,
            }
            print(f"Testing normality for {piece_id} with {len(values)} samples")
            
            # Quantize values into buckets (0-10, 10-20, ..., 90-100)
            # This matches the histogram buckets
            # Manually quantize: divide by 10 and floor, then clip to [0, 9]
            quantized_indices = np.floor(values / 10).astype(int)
            quantized_indices = np.clip(quantized_indices, 0, 9)
            # Convert to bucket midpoints for testing (5, 15, 25, ..., 95)
            bucket_midpoints = np.array([5, 15, 25, 35, 45, 55, 65, 75, 85, 95])
            quantized_to_midpoints = bucket_midpoints[quantized_indices]
            
            # Initialize variables
            stat, p_value = np.nan, np.nan
            is_normal = None
            
            # Test for normality using Shapiro-Wilk test
            # (works well for sample sizes up to 5000)
            if len(values) >= 3 and len(values) <= 5000:
                try:
                    # Use quantized values for consistency with histogram
                    stat, p_value = stats.shapiro(quantized_to_midpoints)
                    if not np.isnan(p_value):
                        is_normal = p_value > 0.05
                except Exception as e:
                    print(f"  Warning: Shapiro-Wilk test failed: {e}")
                    is_normal = None
            elif len(values) > 5000:
                try:
                    # For large samples, use Kolmogorov-Smirnov test
                    # against normal distribution using quantized/bucketed values
                    mean_val = np.mean(quantized_to_midpoints)
                    std_val = np.std(quantized_to_midpoints)
                    
                    # Check if std is valid (not zero or NaN)
                    if std_val > 0 and not np.isnan(std_val):
                        stat, p_value = stats.kstest(
                            quantized_to_midpoints, 
                            lambda x: stats.norm.cdf(x, loc=mean_val, scale=std_val)
                        )
                        if not np.isnan(p_value) and not np.isnan(stat):
                            is_normal = p_value > 0.05
                            print(f"  K-S test: stat={stat:.4f}, p={p_value:.4f}, normal={is_normal}")
                        else:
                            print(f"  Warning: K-S test returned NaN (stat={stat}, p={p_value})")
                            is_normal = None
                    else:
                        print(f"  Warning: Invalid std_val ({std_val}), cannot test normality")
                        is_normal = None
                except Exception as e:
                    print(f"  Warning: K-S test failed: {e}")
                    is_normal = None
            else:
                # Too few samples (n < 3)
                stat, p_value = np.nan, np.nan
                is_normal = None

            normality_results[piece_key] = {
                'is_normal': is_normal,
                'p_value': p_value,
                'statistic': stat,
                'n_samples': len(values),
            }

    if not all_piece_data:
        print("No data available for histogram analysis.")
        return

    # Create subplots for all pieces
    n_pieces = len(all_piece_data)
    
    # Calculate grid dimensions
    cols = min(3, n_pieces)
    rows = (n_pieces + cols - 1) // cols

    fig, axes = plt.subplots(rows, cols, figsize=(15, 5 * rows))
    
    # Handle different subplot configurations
    # plt.subplots returns different types: single Axes, 1D array, or 2D array
    if n_pieces == 1:
        axes = [axes]
    elif isinstance(axes, np.ndarray):
        if axes.ndim == 2:
            axes = axes.flatten()
        else:
            axes = list(axes)
    else:
        axes = [axes]

    # Plot each piece
    for idx, (piece_key, data) in enumerate(all_piece_data.items()):
        values = data['values']
        concert_id = data['concert_id']
        concert_name = data['concert_name']
        piece_id = data['piece_id']
        ax = axes[idx]

        # Calculate statistics
        mean_val = np.mean(values)
        std_val = np.std(values)
        n_samples = len(values)

        # Create histogram with 10 buckets: 0-10, 10-20, 20-30, ..., 90-100
        bins = np.arange(0, 101, 10)  # Bins: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        counts, bin_edges, patches = ax.hist(
            values, 
            bins=bins, 
            density=True, 
            alpha=0.7, 
            color='skyblue',
            edgecolor='black',
            label='Histogram'
        )

        # Overlay normal distribution
        x_norm = np.linspace(0, 100, 1000)
        y_norm = stats.norm.pdf(x_norm, loc=mean_val, scale=std_val)
        ax.plot(x_norm, y_norm, 'r-', linewidth=2, label='Normal Distribution')

        # Get normality result
        norm_result = normality_results[piece_key]
        is_normal = norm_result['is_normal']
        p_value = norm_result['p_value']

        # Set title with concert name, piece, and normality status
        title = f"{concert_name}\n"
        title += f"Piece: {piece_id[:30]}...\n"
        title += f"μ={mean_val:.2f}, σ={std_val:.2f}, n={n_samples}"
        
        if is_normal is True:
            title += "\n✓ Normal (p={:.4f})".format(p_value)
            ax.set_facecolor('#e8f5e9')  # Light green background
        elif is_normal is False:
            title += "\n✗ Not Normal (p={:.4f})".format(p_value)
            ax.set_facecolor('#ffebee')  # Light red background
        else:
            # Cannot test - either n<3 or test failed
            if n_samples < 3:
                title += "\n? Cannot test (n<3)"
            else:
                title += "\n? Cannot test (test failed)"

        ax.set_title(title, fontsize=10)
        ax.set_xlabel('Value (0-100)', fontsize=9)
        ax.set_ylabel('Density', fontsize=9)
        ax.set_xlim(0, 100)
        ax.grid(True, alpha=0.3)
        ax.legend(fontsize=8)
        
        # Set x-axis ticks to show bucket boundaries
        ax.set_xticks(bins)

    # Hide unused subplots
    for idx in range(n_pieces, len(axes)):
        axes[idx].axis('off')

    plt.tight_layout()
    
    # Save the plot to a file instead of showing (for non-interactive environments)
    # Create output directory if it doesn't exist
    output_dir = 'output'
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = os.path.join(output_dir, f'histogram_analysis_{timestamp}.png')
    
    plt.savefig(filename, dpi=150, bbox_inches='tight')
    print(f"\n✓ Histogram saved to: {filename}")
    
    # Try to show if possible (for interactive environments)
    try:
        plt.show()
    except Exception:
        pass  # Ignore if display is not available
    
    plt.close()

    # Print summary
    print("\n" + "=" * 80)
    print("Normality Test Summary")
    print("=" * 80)

    normal_pieces = []
    non_normal_pieces = []
    untestable_pieces = []

    for piece_key, result in normality_results.items():
        data = all_piece_data[piece_key]
        piece_id = data['piece_id']
        
        if result['is_normal'] is True:
            normal_pieces.append((piece_id, result))
        elif result['is_normal'] is False:
            non_normal_pieces.append((piece_id, result))
        else:
            untestable_pieces.append((piece_id, result))

    if normal_pieces:
        print(f"\n✓ Pieces with NORMAL distribution ({len(normal_pieces)}):")
        for piece_id, result in normal_pieces:
            print(f"  - {piece_id}")
            print(f"    p-value: {result['p_value']:.4f}, n={result['n_samples']}")

    if non_normal_pieces:
        print(f"\n✗ Pieces with NON-NORMAL distribution ({len(non_normal_pieces)}):")
        for piece_id, result in non_normal_pieces:
            print(f"  - {piece_id}")
            print(f"    p-value: {result['p_value']:.4f}, n={result['n_samples']}")

    if untestable_pieces:
        print(f"\n? Pieces that could not be tested ({len(untestable_pieces)}):")
        for piece_id, result in untestable_pieces:
            print(f"  - {piece_id} (n={result['n_samples']})")

    print("\n" + "=" * 80)


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
        ("Value Histogram with Normal Distribution", "histogram"),
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
    elif test_id == "histogram":
        # Run histogram analysis with normal distribution
        run_value_histogram_analysis(db, concert_ids, piece_ids, user_selections)

    print_header("Analysis Complete")


if __name__ == "__main__":
    main()

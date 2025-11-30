"""
Test script for database functions
"""

from db import Database
import pandas as pd


def print_separator(title: str = ""):
    """Print a visual separator"""
    print("\n" + "=" * 80)
    if title:
        print(f" {title}")
        print("=" * 80)
    print()


def main():
    """Main test function for database operations"""

    # Initialize database
    print("Initializing database...")
    db = Database()

    # Test 1: List all concerts
    print_separator("TEST 1: List all concerts")
    concerts = db.list_concerts()
    print(f"Found {len(concerts)} concerts:")
    for concert in concerts:
        print(f"  - {concert['name']} (ID: {concert['id']})")

    # Use first concert for further tests
    if not concerts:
        print("No concerts found. Exiting.")
        return

    test_concert_id = concerts[0]["id"]
    test_concert_name = concerts[0]["name"]
    for test_concert_id, test_concert_name in [
        (concert["id"], concert["name"]) for concert in concerts
    ]:
        # Test 2: List pieces for a concert
        print_separator(f"TEST 2: List pieces for concert '{test_concert_name}'")
        pieces = db.list_concert_pieces(test_concert_id)
        print(f"Found {len(pieces)} pieces:")
        for i, piece in enumerate(pieces[:10], 1):  # Show first 10
            print(f"  {i}. {piece}")
        if len(pieces) > 10:
            print(f"  ... and {len(pieces) - 10} more pieces")

        # Use first piece for further tests
        if not pieces:
            print("No pieces found for this concert. Exiting.")
            return

        test_piece_id = pieces[0]

        # Test 3: List users for a concert and piece
        print_separator(
            f"TEST 3: List users for concert '{test_concert_name}' "
            f"and piece '{test_piece_id}'"
        )
        users = db.list_concert_piece_users(test_concert_id, test_piece_id)
        print(f"Found {len(users)} users:")
        for i, user in enumerate(users[:5], 1):  # Show first 5
            print(f"  {i}. User ID: {user['id']}")
            print(f"     Device: {user['deviceType']}")
            print(f"     Active: {user['isActive']}")
        if len(users) > 5:
            print(f"  ... and {len(users) - 5} more users")

        # Use first user for further tests
        if not users:
            print("No users found for this piece. Exiting.")
            return

        test_user_id = users[0]["id"]

        # Test 4: Get forms for specific concert, piece, and user
        print_separator(
            f"TEST 4: Get forms for concert '{test_concert_name}', "
            f"piece '{test_piece_id}', user '{test_user_id[:8]}...'"
        )
        forms = db.get_forms_for_concert_piece_user(
            test_concert_id, test_piece_id, test_user_id
        )
        print(f"Found {len(forms)} forms:")
        for i, form in enumerate(forms[:5], 1):  # Show first 5
            print(f"  {i}. Timestamp: {form['timestamp']}, Value: {form['value']}")
        if len(forms) > 5:
            print(f"  ... and {len(forms) - 5} more forms")

        # Test 5: Get forms as pandas DataFrame
        print_separator(
            f"TEST 5: Get forms as DataFrame for concert '{test_concert_name}' "
            f"and piece '{test_piece_id}'"
        )
        df = db.get_forms_dataframe(concert_id=test_concert_id, piece_id=test_piece_id)
        print(f"DataFrame shape: {df.shape}")
        print("\nFirst 5 rows:")
        print(df.head())

        print("\nDataFrame info:")
        print(df.info())

        print("\nValue statistics:")
        print(df["value"].describe())

        # Test 6: Get concert statistics
        print_separator(f"TEST 6: Concert statistics for '{test_concert_name}'")
        stats = db.get_concert_statistics(test_concert_id)
        print(f"Concert ID: {stats['concert_id']}")
        print(f"Total pieces: {stats['total_pieces']}")
        print("\nPieces breakdown:")
        for i, (piece_id, piece_stats) in enumerate(
            list(stats["pieces"].items())[:5], 1
        ):
            print(f"\n  {i}. Piece: {piece_id}")
            print(f"     Users: {piece_stats['total_users']}")
            print(f"     Forms: {piece_stats['total_forms']}")
        if len(stats["pieces"]) > 5:
            print(f"\n  ... and {len(stats['pieces']) - 5} more pieces")

        # Test 7: DataFrame for entire concert
        print_separator(f"TEST 7: Full DataFrame for concert '{test_concert_name}'")
        full_df = db.get_forms_dataframe(concert_id=test_concert_id)
        print(f"Total forms in concert: {len(full_df)}")
        print(f"Unique pieces: {full_df['piece_id'].nunique()}")
        print(f"Unique users: {full_df['client_id'].nunique()}")

        print("\nValue distribution:")
        print(full_df["value"].value_counts().sort_index())

        print_separator("All tests completed successfully!")


if __name__ == "__main__":
    main()

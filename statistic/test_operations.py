"""
Test script for resampling operations
"""
from operations import resample_data, resample_dataframe
import pandas as pd


def test_linear_interpolation():
    """Test linear interpolation resampling"""
    print("=" * 80)
    print("TEST: Linear Interpolation")
    print("=" * 80)
    
    # Create sample data with irregular timestamps
    data = [
        {'timestamp': 0, 'value': 0},
        {'timestamp': 100, 'value': 10},
        {'timestamp': 250, 'value': 25},
        {'timestamp': 400, 'value': 40},
    ]
    
    print("\nOriginal data:")
    for point in data:
        print(f"  t={point['timestamp']}, v={point['value']}")
    
    # Resample to 50ms windows with linear interpolation
    resampled = resample_data(data, window_ms=50, interpolation_method='linear')
    
    print("\nResampled data (50ms windows, linear):")
    for point in resampled:
        print(f"  t={point['timestamp']}, v={point['value']:.2f}")
    
    print(f"\nOriginal points: {len(data)}, Resampled points: {len(resampled)}")


def test_step_interpolation():
    """Test step interpolation resampling"""
    print("\n" + "=" * 80)
    print("TEST: Step Interpolation")
    print("=" * 80)
    
    # Create sample data
    data = [
        {'timestamp': 0, 'value': 0},
        {'timestamp': 100, 'value': 10},
        {'timestamp': 250, 'value': 25},
        {'timestamp': 400, 'value': 40},
    ]
    
    print("\nOriginal data:")
    for point in data:
        print(f"  t={point['timestamp']}, v={point['value']}")
    
    # Resample to 50ms windows with step interpolation
    resampled = resample_data(data, window_ms=50, interpolation_method='step')
    
    print("\nResampled data (50ms windows, step):")
    for point in resampled:
        print(f"  t={point['timestamp']}, v={point['value']:.2f}")
    
    print(f"\nOriginal points: {len(data)}, Resampled points: {len(resampled)}")


def test_dataframe_resampling():
    """Test DataFrame resampling"""
    print("\n" + "=" * 80)
    print("TEST: DataFrame Resampling")
    print("=" * 80)
    
    # Create sample DataFrame
    df = pd.DataFrame([
        {'timestamp': 0, 'value': 0},
        {'timestamp': 100, 'value': 10},
        {'timestamp': 250, 'value': 25},
        {'timestamp': 400, 'value': 40},
        {'timestamp': 600, 'value': 60},
    ])
    
    print("\nOriginal DataFrame:")
    print(df)
    
    # Resample with linear interpolation
    resampled_linear = resample_dataframe(
        df, 
        window_ms=100, 
        interpolation_method='linear'
    )
    
    print("\nResampled DataFrame (100ms windows, linear):")
    print(resampled_linear)
    
    # Resample with step interpolation
    resampled_step = resample_dataframe(
        df, 
        window_ms=100, 
        interpolation_method='step'
    )
    
    print("\nResampled DataFrame (100ms windows, step):")
    print(resampled_step)


def test_edge_cases():
    """Test edge cases"""
    print("\n" + "=" * 80)
    print("TEST: Edge Cases")
    print("=" * 80)
    
    # Empty data
    empty = resample_data([], window_ms=100, interpolation_method='linear')
    print(f"\nEmpty data: {empty}")
    
    # Single point
    single = resample_data([{'timestamp': 100, 'value': 50}], 
                          window_ms=50, 
                          interpolation_method='linear')
    print(f"\nSingle point resampled: {single}")
    
    # Two points
    two_points = resample_data(
        [{'timestamp': 0, 'value': 0}, {'timestamp': 100, 'value': 100}],
        window_ms=25,
        interpolation_method='linear'
    )
    print(f"\nTwo points resampled to 25ms windows:")
    for point in two_points:
        print(f"  t={point['timestamp']}, v={point['value']:.2f}")


def test_with_real_data():
    """Test with data structure from database"""
    print("\n" + "=" * 80)
    print("TEST: Real Data Structure")
    print("=" * 80)
    
    # Simulate data from database
    from db import Database
    
    db = Database()
    concerts = db.list_concerts()
    
    if concerts:
        concert_id = concerts[0]['id']
        pieces = db.list_concert_pieces(concert_id)
        
        if pieces:
            piece_id = pieces[0]
            users = db.list_concert_piece_users(concert_id, piece_id)
            
            if users:
                user_id = users[0]['id']
                forms = db.get_forms_for_concert_piece_user(
                    concert_id, 
                    piece_id, 
                    user_id
                )
                
                if forms:
                    print(f"\nUser {user_id[:8]}... has {len(forms)} forms")
                    
                    # Prepare data for resampling
                    data = [
                        {'timestamp': form['timestamp'], 'value': form['value']}
                        for form in forms
                    ]
                    
                    # Show original data range
                    print(f"Original timestamp range: "
                          f"{data[0]['timestamp']} to {data[-1]['timestamp']}")
                    print(f"Duration: "
                          f"{(data[-1]['timestamp'] - data[0]['timestamp'])/1000:.2f} seconds")
                    
                    # Resample to 1 second windows
                    resampled = resample_data(
                        data, 
                        window_ms=1000, 
                        interpolation_method='linear'
                    )
                    
                    print(f"\nResampled to 1s windows: {len(resampled)} points")
                    print("\nFirst 5 resampled points:")
                    for point in resampled[:5]:
                        print(f"  t={point['timestamp']}, v={point['value']:.2f}")
                    
                    print("\nLast 5 resampled points:")
                    for point in resampled[-5:]:
                        print(f"  t={point['timestamp']}, v={point['value']:.2f}")


def main():
    """Run all tests"""
    test_linear_interpolation()
    test_step_interpolation()
    test_dataframe_resampling()
    test_edge_cases()
    test_with_real_data()
    
    print("\n" + "=" * 80)
    print("All tests completed!")
    print("=" * 80)


if __name__ == "__main__":
    main()

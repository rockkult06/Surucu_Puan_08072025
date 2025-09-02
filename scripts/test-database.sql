-- Test database connection and structure
-- This script will help diagnose database issues

-- Test 1: Check if we can connect and run basic queries
SELECT 'Database connection test successful' as test_result, NOW() as current_time;

-- Test 2: Check if the table exists
SELECT 
    table_name, 
    table_type,
    is_insertable_into
FROM information_schema.tables 
WHERE table_name = 'ahp_evaluations';

-- Test 3: Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ahp_evaluations'
ORDER BY ordinal_position;

-- Test 4: Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'ahp_evaluations';

-- Test 5: Count existing records
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT user_name) as unique_users,
    MIN(created_at) as oldest_record,
    MAX(updated_at) as newest_record
FROM ahp_evaluations;

-- Test 6: Sample data (if any exists)
SELECT 
    id,
    user_name,
    created_at,
    updated_at,
    CASE 
        WHEN criteria_weights IS NOT NULL THEN 'Has criteria_weights'
        ELSE 'Missing criteria_weights'
    END as criteria_status,
    CASE 
        WHEN global_weights IS NOT NULL THEN 'Has global_weights'
        ELSE 'Missing global_weights'
    END as weights_status
FROM ahp_evaluations 
ORDER BY updated_at DESC 
LIMIT 5;

-- Test 7: Check for any JSON parsing issues
SELECT 
    id,
    user_name,
    CASE 
        WHEN criteria_weights::text ~ '^{.*}$' THEN 'Valid JSON'
        ELSE 'Invalid JSON'
    END as criteria_weights_format,
    CASE 
        WHEN global_weights::text ~ '^{.*}$' THEN 'Valid JSON'
        ELSE 'Invalid JSON'
    END as global_weights_format
FROM ahp_evaluations
WHERE criteria_weights IS NOT NULL OR global_weights IS NOT NULL
LIMIT 3;

-- Test 8: Database version and settings
SELECT version() as database_version;

-- Test 9: Check permissions
SELECT 
    has_table_privilege('ahp_evaluations', 'SELECT') as can_select,
    has_table_privilege('ahp_evaluations', 'INSERT') as can_insert,
    has_table_privilege('ahp_evaluations', 'UPDATE') as can_update,
    has_table_privilege('ahp_evaluations', 'DELETE') as can_delete;

-- Test 10: Final status
SELECT 
    'All database tests completed successfully' as final_status,
    NOW() as completion_time;

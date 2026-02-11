-- Sample activity data for User 166 (test business user)
INSERT INTO user_activity_log 
(user_id, activity_type, activity_category, description, target_type, target_id, status, ip_address, created_at) 
VALUES 
(166, 'login', 'authentication', 'User logged in successfully', 'user', '166', 'success', inet '192.168.1.100', NOW() - INTERVAL '2 hours'),
(166, 'business_profile_view', 'data_management', 'Viewed business profile details', 'business_users', '2', 'success', inet '192.168.1.100', NOW() - INTERVAL '1 hour 55 minutes'),
(166, 'data_edit', 'data_management', 'Updated business company size', 'business_users', '2', 'success', inet '192.168.1.100', NOW() - INTERVAL '1 hour 50 minutes'),
(166, 'course_enrollment', 'course', 'Enrolled in IFR Advanced Training Course', 'course', '5', 'success', inet '192.168.1.100', NOW() - INTERVAL '1 hour 45 minutes'),
(166, 'comment_add', 'comments', 'Posted comment on course forum', 'course_comment', '123', 'success', inet '192.168.1.100', NOW() - INTERVAL '1 hour 30 minutes'),
(166, 'flight_plan_create', 'flight_plan', 'Created new flight plan from SBGR to KJFK', 'flight_plan', '456', 'success', inet '192.168.1.100', NOW() - INTERVAL '1 hour 20 minutes'),
(166, 'data_edit', 'data_management', 'Updated personal information', 'user', '166', 'success', inet '192.168.1.100', NOW() - INTERVAL '1 hour 10 minutes'),
(166, 'document_upload', 'data_management', 'Uploaded business verification document', 'business_users', '2', 'success', inet '192.168.1.100', NOW() - INTERVAL '1 hour'),
(166, 'hangar_inquiry', 'hangar', 'Viewed hangar listing SBSP-HAG-001', 'hangar', '1001', 'success', inet '192.168.1.100', NOW() - INTERVAL '50 minutes'),
(166, 'course_progress', 'course', 'Completed course module 3 with score 95%', 'course', '5', 'success', inet '192.168.1.100', NOW() - INTERVAL '40 minutes'),
(166, 'logout', 'authentication', 'User logged out', 'user', '166', 'success', inet '192.168.1.100', NOW() - INTERVAL '5 minutes');

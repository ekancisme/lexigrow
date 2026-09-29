import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.cell.cell import MergedCell
import datetime

BACKUP_PATH = '/home/youngltc/Downloads/1737_DN_SE_48_Report5_UnitTest_BACKUP.xlsx'
OUTPUT_DOWNLOADS = '/home/youngltc/Downloads/1737_DN_SE_48_Report5_UnitTest.xlsx'
OUTPUT_WORKSPACE = '/home/youngltc/Documents/Coding/lexigrow/LexiGrow_16UC_UnitTest_Report.xlsx'

wb = openpyxl.load_workbook(BACKUP_PATH)

def set_val(ws, r, c, val):
    cell = ws.cell(r, c)
    if not isinstance(cell, MergedCell):
        cell.value = val

def clear_range(ws, min_r, max_r, min_c, max_c):
    for r in range(min_r, max_r + 1):
        for c in range(min_c, max_c + 1):
            set_val(ws, r, c, None)

# Common Styles
f_tahoma_11_bold = Font(name='Tahoma', size=11, bold=True)
f_tahoma_11_regular = Font(name='Tahoma', size=11, bold=False)
f_tahoma_8_bold_white = Font(name='Tahoma', size=8, bold=True, color='FFFFFF')
fill_navy = PatternFill(start_color='000080', end_color='000080', fill_type='solid')

align_left = Alignment(horizontal='left', vertical='center')
align_center = Alignment(horizontal='center', vertical='center')

border_thin_bottom = Border(bottom=Side(style='thin', color='000000'))

# 16 Core Use Cases - 100% Professional Technical English
use_cases = [
    {
        "code": "LVFS-01",
        "req_name": "Register Account",
        "class_name": "AuthController",
        "desc": "Register new user account, create PendingUser record, and send verification email with OTP (valid for 15 minutes).",
        "preconditions": [
            ("Email service and authentication server are operational", [0, 1, 2, 3, 4, 5]),
            ("Email is not yet registered in the system", [0, 2, 3, 4, 5]),
            ("Email already exists in system (User or PendingUser record)", [1]),
            ("Email delivery service encounters error (SMTP failure / Server exception)", [6]),
        ],
        "input_label": "Input (Registration Details)",
        "inputs": [
            ("Valid data: name='New Student', email='newstudent@example.com', password='Password123', role='student', level='A2'", [0, 6]),
            ("Duplicate email: email='newstudent@example.com'", [1]),
            ("Invalid email format: email='invalid-email'", [2]),
            ("Empty or null email: email=''", [3]),
            ("Password too short (< 6 characters): password='123'", [4]),
            ("Empty password: password=''", [5]),
        ],
        "returns": [
            ("201 Created (Pending user created and OTP email dispatched successfully)", [0]),
            ("400 Bad Request (Invalid/missing email or invalid password format)", [2, 3, 4, 5]),
            ("409 Conflict (Email already registered in the system)", [1]),
            ("500 Internal Server Error (Mail delivery failure or unexpected server error)", [6]),
        ],
        "exceptions": [
            ("None", [0]),
            ("ValidationException (Input validation failed)", [2, 3, 4, 5]),
            ("DuplicateEmailException (Email already in use)", [1]),
            ("EmailDeliveryException / System.Exception", [6]),
        ],
        "logs": [
            ("“Pending user created and OTP sent successfully.”", [0]),
            ("“Registration failed: Invalid input payload.”", [2, 3, 4, 5]),
            ("“Registration failed: Email already exists.”", [1]),
            ("“Error occurred while dispatching verification email.”", [6]),
        ],
        "types": ["N", "A", "A", "A", "B", "A", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P"],
    },
    {
        "code": "LVFS-02",
        "req_name": "Login",
        "class_name": "AuthController",
        "desc": "Authenticate user via email and password, check account status, issue JWT token, and load linked student profiles for Parent role.",
        "preconditions": [
            ("User exists and account status is active", [0, 1]),
            ("User account is unverified (pending email verification)", [4]),
            ("User account is disabled or banned", [5]),
            ("Authentication server and database are operational", [0, 1, 2, 3, 4, 5]),
            ("Database connection failure during authentication", [6]),
        ],
        "input_label": "Input (Login Credentials)",
        "inputs": [
            ("Valid email and password: 'student@example.com', 'Password123'", [0, 4, 5, 6]),
            ("Incorrect password: email='student@example.com', password='WrongPassword'", [1]),
            ("Non-existent email: email='notfound@example.com'", [2]),
            ("Empty email or password: email='', password=''", [3]),
        ],
        "returns": [
            ("200 OK (Login successful, JWT access token and user profile returned)", [0]),
            ("400 Bad Request (Missing email or password field)", [3]),
            ("401 Unauthorized (Incorrect email or password)", [1, 2]),
            ("403 Forbidden (Account is unverified or disabled)", [4, 5]),
            ("500 Internal Server Error (Database or server exception)", [6]),
        ],
        "exceptions": [
            ("None", [0]),
            ("InvalidCredentialsException", [1, 2]),
            ("ValidationException", [3]),
            ("AccountDisabledException / UnverifiedAccountException", [4, 5]),
            ("DatabaseException / System.Exception", [6]),
        ],
        "logs": [
            ("“User logged in successfully.”", [0]),
            ("“Login failed: Invalid credentials provided.”", [1, 2]),
            ("“Login failed: Missing required authentication fields.”", [3]),
            ("“Login forbidden: Account unverified or disabled.”", [4, 5]),
            ("“Unexpected error during authentication process.”", [6]),
        ],
        "types": ["N", "A", "A", "A", "A", "A", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P"],
    },
    {
        "code": "LVFS-03",
        "req_name": "Login with Google",
        "class_name": "AuthController",
        "desc": "Exchange Google authorization code, verify ID token, retrieve or register user account, and issue JWT token.",
        "preconditions": [
            ("Google OAuth service is available and reachable", [0, 1, 2, 3, 4]),
            ("Google account is already linked to an existing user in the database", [0]),
            ("Google account does not exist in system (first-time OAuth registration)", [1]),
            ("Google OAuth endpoint failure or connection timeout", [5]),
            ("Internal system server exception", [6]),
        ],
        "input_label": "Input (Google Auth Code / Role)",
        "inputs": [
            ("Valid authorization code for existing user: code='google-auth-code-123'", [0]),
            ("Valid authorization code for new user: code='google-auth-code-new', role='student'", [1, 5, 6]),
            ("Invalid or expired authorization code: code='invalid-expired-code'", [2]),
            ("Missing authorization code: code='' or null", [3]),
            ("Invalid or unauthorized target role: role='invalid_role'", [4]),
        ],
        "returns": [
            ("200 OK (Google login successful, JWT token issued)", [0]),
            ("201 Created (New Google user registered and JWT token issued)", [1]),
            ("400 Bad Request (Missing code or invalid role payload)", [3, 4]),
            ("401 Unauthorized (Invalid or expired Google authentication code)", [2]),
            ("502 Bad Gateway (Failed to exchange code with Google OAuth API)", [5]),
            ("500 Internal Server Error (Internal server exception)", [6]),
        ],
        "exceptions": [
            ("None", [0, 1]),
            ("OAuthTokenExpiredException", [2]),
            ("ValidationException", [3, 4]),
            ("ExternalServiceException", [5]),
            ("System.Exception", [6]),
        ],
        "logs": [
            ("“User authenticated successfully via Google OAuth.”", [0]),
            ("“New user registered and authenticated via Google.”", [1]),
            ("“Google authentication failed: Invalid or expired code.”", [2]),
            ("“Google authentication failed: Malformed request payload.”", [3, 4]),
            ("“Google OAuth service unreachable or timeout.”", [5]),
            ("“Unexpected error during Google login process.”", [6]),
        ],
        "types": ["N", "N", "A", "A", "A", "A", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P"],
    },
    {
        "code": "LVFS-04",
        "req_name": "Verify Email",
        "class_name": "AuthController",
        "desc": "Validate email OTP code within expiration window, convert PendingUser into active User, and issue JWT token.",
        "preconditions": [
            ("Pending user record exists with unexpired OTP code", [0, 1, 3]),
            ("OTP code for pending user has expired", [2]),
            ("No pending user record found for the provided email", [4]),
            ("Database service is operational", [0, 1, 2, 3, 4, 5]),
            ("Database exception occurs during account activation", [6]),
        ],
        "input_label": "Input (Email & OTP Code)",
        "inputs": [
            ("Correct email and valid OTP: email='pending@example.com', code='654321'", [0, 6]),
            ("Incorrect OTP code: email='pending@example.com', code='000000'", [1]),
            ("Expired OTP code: email='pending@example.com', code='654321'", [2]),
            ("Invalid OTP format / boundary length: code='12' or code='1234567'", [3]),
            ("Email without pending user record: email='notfound@example.com', code='654321'", [4]),
            ("Missing email or OTP code: email='', code=''", [5]),
        ],
        "returns": [
            ("200 OK (Email verified, user activated, JWT token returned)", [0]),
            ("400 Bad Request (Incorrect OTP, expired OTP, invalid format, or missing fields)", [1, 2, 3, 5]),
            ("404 Not Found (Pending registration record not found)", [4]),
            ("500 Internal Server Error (Database activation failure)", [6]),
        ],
        "exceptions": [
            ("None", [0]),
            ("InvalidOtpException", [1, 3]),
            ("ExpiredOtpException", [2]),
            ("PendingUserNotFoundException", [4]),
            ("ValidationException", [5]),
            ("DatabaseException / System.Exception", [6]),
        ],
        "logs": [
            ("“Email verified and user account activated successfully.”", [0]),
            ("“Email verification failed: Incorrect OTP provided.”", [1, 3]),
            ("“Email verification failed: OTP has expired.”", [2]),
            ("“Email verification failed: Pending user record not found.”", [4]),
            ("“Email verification failed: Missing required fields.”", [5]),
            ("“Database error during user account activation.”", [6]),
        ],
        "types": ["N", "A", "A", "B", "A", "A", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P"],
    },
    {
        "code": "LVFS-05",
        "req_name": "Resend Verification Email",
        "class_name": "AuthController",
        "desc": "Generate a fresh OTP code for a pending registration and resend verification email; handle verified or non-existent accounts.",
        "preconditions": [
            ("User account is in pending verification state (PendingUser exists)", [0, 5]),
            ("Email address does not exist in the system", [1]),
            ("Email address is already verified (active User record exists)", [2]),
            ("Email service and server are operational", [0, 1, 2, 3, 4]),
            ("Email delivery service encounters error (SMTP failure)", [5]),
            ("Internal server exception", [6]),
        ],
        "input_label": "Input (Email)",
        "inputs": [
            ("Valid pending registration email: email='pending@example.com'", [0, 5, 6]),
            ("Non-existent email address: email='nonexistent@example.com'", [1]),
            ("Already verified email address: email='verified@example.com'", [2]),
            ("Empty or null email: email=''", [3]),
            ("Invalid email syntax: email='invalid-email@com'", [4]),
        ],
        "returns": [
            ("200 OK (New OTP generated and verification email resent successfully)", [0]),
            ("400 Bad Request (Empty or malformed email syntax)", [3, 4]),
            ("404 Not Found (Pending registration record not found)", [1]),
            ("409 Conflict (User account is already verified)", [2]),
            ("500 Internal Server Error (Mail delivery failure or server exception)", [5, 6]),
        ],
        "exceptions": [
            ("None", [0]),
            ("ValidationException", [3, 4]),
            ("PendingUserNotFoundException", [1]),
            ("AccountAlreadyVerifiedException", [2]),
            ("EmailDeliveryException / System.Exception", [5, 6]),
        ],
        "logs": [
            ("“Verification email resent successfully with new OTP.”", [0]),
            ("“Resend verification failed: Invalid email input format.”", [3, 4]),
            ("“Resend verification failed: Registration record not found.”", [1]),
            ("“Resend verification failed: Account is already verified.”", [2]),
            ("“Failed to dispatch verification email due to service error.”", [5, 6]),
        ],
        "types": ["N", "A", "A", "A", "A", "A", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P"],
    },
    {
        "code": "LVFS-06",
        "req_name": "Reset Password",
        "class_name": "AuthController",
        "desc": "Dispatch 10-minute password reset OTP via email, verify OTP code, and update account password securely.",
        "preconditions": [
            ("User account exists in the database", [0, 3, 4, 5, 6, 7]),
            ("Email dispatch service is operational", [0, 1, 2, 3, 4, 5, 6]),
            ("Password reset OTP is valid and within expiration window", [3]),
            ("Password reset OTP is incorrect or expired", [4, 5]),
            ("Server exception occurs during password update", [7]),
        ],
        "input_label": "Input (Step 1 Request OTP & Step 2 Confirm OTP)",
        "inputs": [
            ("Step 1: Request OTP with registered email: 'student@example.com'", [0]),
            ("Step 1: Request OTP with non-existent email: 'unknown@example.com'", [1]),
            ("Step 1: Request OTP with empty email: email=''", [2]),
            ("Step 2: Reset password with correct OTP and valid password ('Password123')", [3, 7]),
            ("Step 2: Reset password with incorrect OTP code", [4]),
            ("Step 2: Reset password with expired OTP code", [5]),
            ("Step 2: New password fails boundary length (< 6 characters)", [6]),
        ],
        "returns": [
            ("200 OK (Reset OTP dispatched / Password updated successfully)", [0, 3]),
            ("400 Bad Request (Empty email, weak password, invalid or expired OTP)", [2, 4, 5, 6]),
            ("404 Not Found (User account not found)", [1]),
            ("500 Internal Server Error (Database or server exception)", [7]),
        ],
        "exceptions": [
            ("None", [0, 3]),
            ("ValidationException", [2, 6]),
            ("UserNotFoundException", [1]),
            ("InvalidOtpException", [4]),
            ("ExpiredOtpException", [5]),
            ("DatabaseException / System.Exception", [7]),
        ],
        "logs": [
            ("“Password reset OTP dispatched to email successfully.”", [0]),
            ("“Password reset completed and updated successfully.”", [3]),
            ("“Password reset request rejected: Account not found.”", [1]),
            ("“Password reset failed: Invalid or expired OTP code.”", [4, 5]),
            ("“Password reset failed: Input validation error.”", [2, 6]),
            ("“Unexpected error during password reset procedure.”", [7]),
        ],
        "types": ["N", "A", "A", "N", "A", "A", "B", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P", "P"],
    },
    {
        "code": "LVFS-07",
        "req_name": "Get Current User Information",
        "class_name": "UserController",
        "desc": "Inspect JWT token and account status to return current authenticated user details, including linked children for Parent role.",
        "preconditions": [
            ("User is authenticated with a valid, active JWT access token", [0, 1, 2]),
            ("Request does not contain Authorization header (unauthenticated)", [3]),
            ("Authorization token is malformed, invalid, or expired", [4]),
            ("User referenced in JWT payload has been deleted from database", [5]),
            ("Database connection error during user query", [6]),
        ],
        "input_label": "Input (Authorization Header)",
        "inputs": [
            ("Valid JWT token for Student: Authorization='Bearer valid-student-token'", [0]),
            ("Valid JWT token for Parent (includes linked children list)", [1]),
            ("Valid JWT token for Teacher: Authorization='Bearer valid-teacher-token'", [2]),
            ("Missing token: Authorization header omitted", [3]),
            ("Invalid or expired token: Authorization='Bearer expired-token'", [4]),
            ("Token references non-existent user ID in database", [5]),
            ("Valid token but database query times out", [6]),
        ],
        "returns": [
            ("200 OK (Current user details returned: ID, email, name, role, status)", [0, 1, 2]),
            ("401 Unauthorized (Missing, malformed, or expired token)", [3, 4]),
            ("404 Not Found (User account no longer exists in system)", [5]),
            ("500 Internal Server Error (Database query exception)", [6]),
        ],
        "exceptions": [
            ("None", [0, 1, 2]),
            ("AuthException / UnauthorizedAccessException", [3, 4]),
            ("UserNotFoundException", [5]),
            ("DatabaseException / System.Exception", [6]),
        ],
        "logs": [
            ("“Current user information retrieved successfully.”", [0, 1, 2]),
            ("“Unauthorized: Missing or invalid authentication token.”", [3, 4]),
            ("“User account not found in database.”", [5]),
            ("“Database error encountered while retrieving current user.”", [6]),
        ],
        "types": ["N", "N", "N", "A", "A", "A", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P"],
    },
    {
        "code": "LVFS-08",
        "req_name": "View Personal Profile",
        "class_name": "ProfileController",
        "desc": "Retrieve personal profile details from GET /api/profile for authenticated user session.",
        "preconditions": [
            ("User exists and is authenticated with a valid session", [0, 1]),
            ("User is unauthenticated or token is invalid", [2, 3]),
            ("Personal profile record not found in database", [4]),
            ("Database connection error or query timeout", [5, 6]),
        ],
        "input_label": "Input (Profile Query / Token)",
        "inputs": [
            ("Valid token for user with comprehensive profile data", [0]),
            ("Valid token for newly registered user (default profile state)", [1]),
            ("Missing authentication token: Authorization=''", [2]),
            ("Invalid or expired token: Authorization='Bearer bad-token'", [3]),
            ("Token belonging to user deleted from system", [4]),
            ("Valid token but database query times out", [5]),
            ("Unexpected internal server failure", [6]),
        ],
        "returns": [
            ("200 OK (Personal profile details returned: name, email, level, avatar)", [0, 1]),
            ("401 Unauthorized (Unauthenticated or invalid token)", [2, 3]),
            ("404 Not Found (Personal profile record not found)", [4]),
            ("500 Internal Server Error (Database or server exception)", [5, 6]),
        ],
        "exceptions": [
            ("None", [0, 1]),
            ("AuthException", [2, 3]),
            ("ProfileNotFoundException", [4]),
            ("DatabaseException / System.Exception", [5, 6]),
        ],
        "logs": [
            ("“Personal profile retrieved successfully.”", [0, 1]),
            ("“Access denied: Unauthorized attempt to view profile.”", [2, 3]),
            ("“Personal profile record not found in database.”", [4]),
            ("“Unexpected error encountered while loading user profile.”", [5, 6]),
        ],
        "types": ["N", "N", "A", "A", "A", "A", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P"],
    },
    {
        "code": "LVFS-09",
        "req_name": "Edit Personal Profile",
        "class_name": "ProfileController",
        "desc": "Update name, email, institution, and englishLevel attributes for authenticated user account.",
        "preconditions": [
            ("User is authenticated and exists in the system", [0, 1, 2, 3, 4, 5, 7]),
            ("Authentication token is invalid or expired", [6]),
            ("Database service is operational", [0, 1, 2, 3, 4, 5, 6]),
            ("Database connection failure during profile save", [7]),
        ],
        "input_label": "Input (Profile Update Data)",
        "inputs": [
            ("Valid full update: name='Student Updated', englishLevel='B2', institution='Lexi University'", [0, 7]),
            ("Valid partial update: name='Nguyen Van A' (other fields unchanged)", [1]),
            ("Empty request body: {}", [2]),
            ("Invalid englishLevel (outside CEFR A1-C2): level='Z9'", [3]),
            ("Name at boundary maximum length: exactly 100 characters", [4]),
            ("Name exceeds maximum length: > 100 characters", [5]),
            ("Invalid or expired authentication token", [6]),
        ],
        "returns": [
            ("200 OK (Profile updated successfully and updated object returned)", [0, 1, 4]),
            ("400 Bad Request (Empty body, invalid CEFR level, or name exceeding limit)", [2, 3, 5]),
            ("401 Unauthorized (Unauthenticated request)", [6]),
            ("500 Internal Server Error (Database persistence failure)", [7]),
        ],
        "exceptions": [
            ("None", [0, 1, 4]),
            ("ValidationException", [2, 3, 5]),
            ("AuthException", [6]),
            ("DatabaseException / System.Exception", [7]),
        ],
        "logs": [
            ("“Personal profile updated successfully.”", [0, 1, 4]),
            ("“Profile update failed: Invalid input payload.”", [2, 3, 5]),
            ("“Unauthorized profile update attempt rejected.”", [6]),
            ("“Database error occurred during personal profile update.”", [7]),
        ],
        "types": ["N", "N", "A", "A", "B", "A", "A", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P", "P"],
    },
    {
        "code": "LVFS-10",
        "req_name": "Change Password",
        "class_name": "UserController",
        "desc": "Validate existing password, save new password, and hash via User pre-save encryption hook.",
        "preconditions": [
            ("User is authenticated and possesses an existing password", [0, 1, 2, 3, 4, 5, 7]),
            ("Authentication token is missing or invalid", [6]),
            ("Database service is operational", [0, 1, 2, 3, 4, 5, 6]),
            ("Database exception occurs during password encryption/save", [7]),
        ],
        "input_label": "Input (Passwords)",
        "inputs": [
            ("Correct current password and valid new password: 'OldPassword123' -> 'NewSecretPassword456'", [0, 7]),
            ("Incorrect current password: currentPassword='WrongOldPassword'", [1]),
            ("New password identical to old password: newPassword='OldPassword123'", [2]),
            ("Missing required fields: newPassword=''", [3]),
            ("New password at minimum boundary length: exactly 6 characters ('Pass01')", [4]),
            ("New password below minimum length: < 6 characters ('123')", [5]),
            ("Missing or invalid authentication token", [6]),
        ],
        "returns": [
            ("200 OK (Password changed successfully and new hash persisted)", [0, 4]),
            ("400 Bad Request (Incorrect old password, duplicate password, missing fields, or short password)", [1, 2, 3, 5]),
            ("401 Unauthorized (Unauthenticated request)", [6]),
            ("500 Internal Server Error (Database persistence error)", [7]),
        ],
        "exceptions": [
            ("None", [0, 4]),
            ("InvalidPasswordException", [1, 2]),
            ("ValidationException", [3, 5]),
            ("AuthException", [6]),
            ("DatabaseException / System.Exception", [7]),
        ],
        "logs": [
            ("“Password changed successfully.”", [0, 4]),
            ("“Change password failed: Incorrect current password provided.”", [1]),
            ("“Change password failed: New password cannot match previous password.”", [2]),
            ("“Change password failed: Input validation error.”", [3, 5]),
            ("“Unauthorized password change attempt rejected.”", [6]),
            ("“Database error encountered while updating password.”", [7]),
        ],
        "types": ["N", "A", "A", "A", "B", "A", "A", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P", "P"],
    },
    {
        "code": "LVFS-11",
        "req_name": "Manage Notification Preferences",
        "class_name": "NotificationController",
        "desc": "Update email, push, and weekly notification flags; preserve unprovided preferences and prevent mass assignment.",
        "preconditions": [
            ("User is authenticated and exists in the system", [0, 1, 2, 3, 4, 6]),
            ("Authentication token is invalid or expired", [5]),
            ("Database service is operational", [0, 1, 2, 3, 4, 5]),
            ("Database persistence failure occurs", [6]),
        ],
        "input_label": "Input (Notification Preferences Body)",
        "inputs": [
            ("Valid comprehensive configuration: email=false, weekly=true, push=true", [0, 6]),
            ("Valid partial update: weekly=false (other preferences unchanged)", [1]),
            ("Non-boolean property values: email='yes', weekly=123", [2]),
            ("Empty request body: {}", [3]),
            ("Unauthorized property submitted (mass assignment prevention): role='admin'", [4]),
            ("Invalid or expired authentication token", [5]),
        ],
        "returns": [
            ("200 OK (Only submitted valid preferences are updated and returned)", [0, 1]),
            ("400 Bad Request (Non-boolean property values or empty payload)", [2, 3, 4]),
            ("401 Unauthorized (Unauthenticated request)", [5]),
            ("500 Internal Server Error (Database persistence failure)", [6]),
        ],
        "exceptions": [
            ("None", [0, 1]),
            ("ValidationException", [2, 3, 4]),
            ("AuthException", [5]),
            ("DatabaseException / System.Exception", [6]),
        ],
        "logs": [
            ("“Notification preferences updated successfully.”", [0, 1]),
            ("“Update preferences failed: Non-boolean or invalid data types.”", [2, 3, 4]),
            ("“Unauthorized notification preference update rejected.”", [5]),
            ("“Database error while saving notification preferences.”", [6]),
        ],
        "types": ["N", "N", "A", "A", "A", "A", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P"],
    },
    {
        "code": "LVFS-12",
        "req_name": "Complete Student Onboarding",
        "class_name": "StudentController",
        "desc": "Finalize Student onboarding by persisting initial learning profile or recording Skip status.",
        "preconditions": [
            ("Student is authenticated and learning profile record exists", [0, 1, 2, 3, 4, 7]),
            ("Authenticated user does not hold Student role (e.g., Teacher or Parent)", [5]),
            ("Authentication token is invalid or expired", [6]),
            ("Internal server exception occurs during onboarding save", [7]),
        ],
        "input_label": "Input (Onboarding Payload)",
        "inputs": [
            ("Complete onboarding: onboardingCompleted=true, targetLevel='B1', interests=['Technology']", [0, 7]),
            ("Skip onboarding: onboardingCompleted=true, skip=true", [1]),
            ("Missing required field: body is empty or lacks onboardingCompleted", [2]),
            ("Non-boolean value: onboardingCompleted='true_string'", [3]),
            ("Interests array at boundary maximum capacity: exactly 10 items", [4]),
            ("Non-student role attempts to invoke onboarding endpoint", [5]),
            ("Invalid or expired authentication token", [6]),
        ],
        "returns": [
            ("200 OK (Onboarding status saved correctly and success response returned)", [0, 1, 4]),
            ("400 Bad Request (Missing required fields or invalid data types)", [2, 3]),
            ("403 Forbidden (User does not hold required Student role)", [5]),
            ("401 Unauthorized (Unauthenticated request)", [6]),
            ("500 Internal Server Error (Database persistence exception)", [7]),
        ],
        "exceptions": [
            ("None", [0, 1, 4]),
            ("ValidationException", [2, 3]),
            ("AccessDeniedException", [5]),
            ("AuthException", [6]),
            ("DatabaseException / System.Exception", [7]),
        ],
        "logs": [
            ("“Student onboarding completed successfully.”", [0, 1, 4]),
            ("“Onboarding failed: Missing or invalid payload parameters.”", [2, 3]),
            ("“Access denied: Only students can complete student onboarding.”", [5]),
            ("“Unauthorized onboarding attempt rejected.”", [6]),
            ("“Unexpected error while persisting student onboarding state.”", [7]),
        ],
        "types": ["N", "N", "A", "A", "B", "A", "A", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P", "P"],
    },
    {
        "code": "LVFS-13",
        "req_name": "Set Learning Preferences",
        "class_name": "StudentController",
        "desc": "Read and update interests, targetLevel, dailyGoalMinutes, pace, and timezone for Student.",
        "preconditions": [
            ("User is authenticated with Student role", [0, 1, 2, 3, 4, 5, 7]),
            ("Authentication token is missing or invalid", [6]),
            ("Database service is operational", [0, 1, 2, 3, 4, 5, 6]),
            ("Database persistence error occurs during save", [7]),
        ],
        "input_label": "Input (Method & Preferences Data)",
        "inputs": [
            ("GET: Query existing learning preferences for student", [0]),
            ("PUT valid: interests=['Business', 'IELTS'], targetLevel='C1', dailyGoalMinutes=20, pace='intensive'", [1, 7]),
            ("PUT empty interests array: interests=[]", [2]),
            ("PUT invalid targetLevel (outside CEFR A1-C2): targetLevel='XYZ'", [3]),
            ("PUT dailyGoalMinutes at valid boundary values: dailyGoalMinutes=5 (min) or 120 (max)", [4]),
            ("PUT invalid pace option: pace='super-fast'", [5]),
            ("Missing or invalid authentication token", [6]),
        ],
        "returns": [
            ("200 OK (GET returns current preferences / PUT persists and returns updated preferences)", [0, 1, 4]),
            ("400 Bad Request (Validation failure for interests, targetLevel, goal, or pace)", [2, 3, 5]),
            ("401 Unauthorized (Unauthenticated request)", [6]),
            ("500 Internal Server Error (Database persistence exception)", [7]),
        ],
        "exceptions": [
            ("None", [0, 1, 4]),
            ("ValidationException", [2, 3, 5]),
            ("AuthException", [6]),
            ("DatabaseException / System.Exception", [7]),
        ],
        "logs": [
            ("“Learning preferences retrieved / updated successfully.”", [0, 1, 4]),
            ("“Update learning preferences failed: Input validation error.”", [2, 3, 5]),
            ("“Unauthorized access to learning preferences rejected.”", [6]),
            ("“Database error while persisting learning preferences.”", [7]),
        ],
        "types": ["N", "N", "A", "A", "B", "A", "A", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P", "P"],
    },
    {
        "code": "LVFS-14",
        "req_name": "View Pricing Plans",
        "class_name": "SubscriptionController",
        "desc": "Return public list of active subscription plans (isActive=true), filterable by Student or Teacher role.",
        "preconditions": [
            ("Pricing plans catalog populated in database; public endpoint available", [0, 1, 2, 3, 5]),
            ("No subscription plans currently active in system (empty catalog)", [4]),
            ("Database connection failure occurs", [6]),
        ],
        "input_label": "Input (Query Parameters)",
        "inputs": [
            ("Retrieve all public plans (default query without filters)", [0]),
            ("Filter by student role: role='student' (returns free, plus, pro plans)", [1]),
            ("Filter by teacher role: role='teacher'", [2]),
            ("Filter by non-existent role: role='unknown'", [3]),
            ("Query when no active subscription plans exist in system", [4]),
            ("Malformed query parameter: role=123", [5]),
            ("Database connection timeout during plan catalog query", [6]),
        ],
        "returns": [
            ("200 OK (Public plan catalog returned: slug, name, price, billing cycles, features)", [0, 1, 2]),
            ("200 OK (Empty array [] returned when no plans match query criteria)", [3, 4]),
            ("400 Bad Request (Malformed filter parameters)", [5]),
            ("500 Internal Server Error (Database connection exception)", [6]),
        ],
        "exceptions": [
            ("None", [0, 1, 2, 3, 4]),
            ("ValidationException", [5]),
            ("DatabaseException / System.Exception", [6]),
        ],
        "logs": [
            ("“Pricing plans catalog retrieved successfully.”", [0, 1, 2]),
            ("“No pricing plans found matching query criteria.”", [3, 4]),
            ("“Invalid query parameters provided for pricing plans.”", [5]),
            ("“Database error encountered while fetching pricing plans.”", [6]),
        ],
        "types": ["N", "N", "N", "A", "B", "A", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P"],
    },
    {
        "code": "LVFS-15",
        "req_name": "Purchase Subscription",
        "class_name": "SubscriptionController",
        "desc": "Validate user, plan, and billing cycle; create PENDING transaction, return PayOS checkout link, and enable secure webhook activation.",
        "preconditions": [
            ("User is authenticated and active", [0, 1, 2, 3, 4, 5, 6, 7]),
            ("Target subscription plan exists and isActive=true", [0, 1, 4, 5, 6, 7]),
            ("Target plan does not exist or is marked inactive", [2, 3]),
            ("PayOS payment gateway service is operational", [0, 1, 2, 3, 4, 5, 6]),
            ("PayOS payment gateway service encounters timeout or connection failure", [7]),
            ("Authentication token is invalid or expired", [8]),
        ],
        "input_label": "Input (Purchase Order Details)",
        "inputs": [
            ("Purchase valid monthly plan: planSlug='plus-student', billingCycle='monthly' (99,000 VND)", [0]),
            ("Purchase valid yearly plan: planSlug='pro-student', billingCycle='yearly'", [1]),
            ("Non-existent plan slug: planSlug='non-existent-plan'", [2]),
            ("Inactive plan slug: planSlug='inactive-plan'", [3]),
            ("Invalid billingCycle option: billingCycle='daily'", [4]),
            ("Missing required fields: missing planSlug", [5]),
            ("Payment amount at PayOS minimum boundary: amount=1,000 VND", [6]),
            ("Valid purchase request but PayOS gateway API times out", [7]),
            ("Missing or invalid authentication token", [8]),
        ],
        "returns": [
            ("201 Created (PENDING transaction created, checkout URL, orderCode, and 99,000 VND returned)", [0, 1, 6]),
            ("400 Bad Request (Invalid billing cycle or missing required parameters)", [4, 5]),
            ("404 Not Found (Plan slug not found or plan is currently inactive)", [2, 3]),
            ("401 Unauthorized (Unauthenticated purchase request)", [8]),
            ("502 Bad Gateway / 500 Internal Server Error (PayOS gateway timeout or server failure)", [7]),
        ],
        "exceptions": [
            ("None", [0, 1, 6]),
            ("ValidationException", [4, 5]),
            ("PlanNotFoundException", [2, 3]),
            ("AuthException", [8]),
            ("PayOSServiceException / System.Exception", [7]),
        ],
        "logs": [
            ("“Payment transaction created and PayOS checkout URL returned successfully.”", [0, 1, 6]),
            ("“Purchase subscription failed: Invalid billing cycle or missing fields.”", [4, 5]),
            ("“Purchase subscription failed: Subscription plan not found or inactive.”", [2, 3]),
            ("“Unauthorized subscription purchase attempt rejected.”", [8]),
            ("“PayOS service timeout encountered during payment order creation.”", [7]),
        ],
        "types": ["N", "N", "A", "A", "A", "A", "B", "A", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P", "P", "P"],
    },
    {
        "code": "LVFS-16",
        "req_name": "View Subscription and Payment History",
        "class_name": "SubscriptionController",
        "desc": "Inspect effective subscription tier (direct plan, class sponsorship, or Free tier) and retrieve transaction payment history.",
        "preconditions": [
            ("User is authenticated and active", [0, 1, 2, 3, 4, 6]),
            ("User possesses an active subscription and recorded payment transactions", [0, 3]),
            ("User is on default Free tier (no paid subscription active)", [1]),
            ("User has an empty payment transaction history", [2]),
            ("Authentication token is invalid or expired", [5]),
            ("Database connection failure occurs", [6]),
        ],
        "input_label": "Input (Filter & Query)",
        "inputs": [
            ("User with active subscription and multiple PAID transactions", [0]),
            ("User on Free tier (no active subscription record)", [1]),
            ("User with empty transaction history (boundary: 0 transactions)", [2]),
            ("Filter transactions by status: status='PAID'", [3]),
            ("Filter transactions by invalid status: status='UNKNOWN'", [4]),
            ("Missing or invalid authentication token", [5]),
            ("Database connection failure during history query", [6]),
        ],
        "returns": [
            ("200 OK (Current subscription status and transaction history returned)", [0, 1, 3]),
            ("200 OK (Free tier status and empty transaction array [] returned)", [2]),
            ("400 Bad Request (Invalid transaction status filter query)", [4]),
            ("401 Unauthorized (Unauthenticated request)", [5]),
            ("500 Internal Server Error (Database query exception)", [6]),
        ],
        "exceptions": [
            ("None", [0, 1, 2, 3]),
            ("ValidationException", [4]),
            ("AuthException", [5]),
            ("DatabaseException / System.Exception", [6]),
        ],
        "logs": [
            ("“Subscription and payment history retrieved successfully.”", [0, 1, 2, 3]),
            ("“Invalid filter parameter provided for payment history.”", [4]),
            ("“Unauthorized access to subscription history rejected.”", [5]),
            ("“Database error encountered while retrieving subscription history.”", [6]),
        ],
        "types": ["N", "N", "B", "N", "A", "A", "A"],
        "results": ["P", "P", "P", "P", "P", "P", "P"],
    },
]

print('1. Updating Cover Sheet...')
ws_cover = wb['Cover']
set_val(ws_cover, 4, 2, "LexiGrow - Intelligent Vocabulary & Writing Growth Platform")
set_val(ws_cover, 5, 2, "LVFS")
set_val(ws_cover, 6, 2, '=B5&"_"&"Unit Test"&"_"&"v1.0"')
set_val(ws_cover, 4, 6, "youngltc")
set_val(ws_cover, 5, 6, datetime.datetime(2026, 9, 27, 0, 0))
set_val(ws_cover, 6, 6, "v1.0")

# Record of change
set_val(ws_cover, 11, 1, datetime.datetime(2026, 9, 27, 0, 0))
set_val(ws_cover, 11, 2, "v1.0")
set_val(ws_cover, 11, 3, "All Document")
set_val(ws_cover, 11, 4, "A")
set_val(ws_cover, 11, 5, "Create unit test document for 16 core use cases")
set_val(ws_cover, 11, 6, "<LexiGrow System Design & Test Specifications>")

clear_range(ws_cover, 12, 16, 1, 10)

print('2. Updating Functions Sheet...')
ws_func = wb['Functions']
set_val(ws_func, 4, 5, "LexiGrow - Intelligent Vocabulary & Writing Growth Platform")
set_val(ws_func, 5, 5, "LVFS")
set_val(ws_func, 6, 5, 0)
set_val(ws_func, 7, 5, "1. Server: Node.js / Express / TypeScript / Jest\n - FE: ReactJS / Vite\n - BE: http://localhost:5000 / LexiGrow Backend API\n 2. Database: MongoDB / PostgreSQL\n 3. Third-party: Google OAuth2, PayOS Gateway")

for i, uc in enumerate(use_cases, start=1):
    row = 10 + i
    set_val(ws_func, row, 1, i)
    set_val(ws_func, row, 2, uc['req_name'])
    set_val(ws_func, row, 3, uc['class_name'])
    set_val(ws_func, row, 4, f'=E{row} & "_" & B{row}')
    set_val(ws_func, row, 5, uc['code'])
    cell_f = ws_func.cell(row, 6)
    cell_f.value = uc['code']
    cell_f.hyperlink = f"#'{uc['code']}'!A1"
    set_val(ws_func, row, 7, uc['desc'])
    set_val(ws_func, row, 8, uc['preconditions'][0][0])

# Clear old rows in Functions (27 to 100)
for r in range(27, 100):
    for c in range(1, 12):
        cell = ws_func.cell(r, c)
        if not isinstance(cell, MergedCell):
            cell.value = None
            cell.hyperlink = None

print('3. Updating Statistics Sheet...')
ws_stat = wb['Statistics']
set_val(ws_stat, 4, 2, "LexiGrow - Intelligent Vocabulary & Writing Growth Platform")
set_val(ws_stat, 5, 2, "LVFS")
set_val(ws_stat, 6, 2, '=B5&"_"&"Test Report"&"_"&"v1.0"')
set_val(ws_stat, 4, 6, "youngltc")
set_val(ws_stat, 5, 6, "Reviewer")
set_val(ws_stat, 6, 6, datetime.datetime(2026, 9, 27, 0, 0))
set_val(ws_stat, 7, 2, "Notes: Core modules for Person 1: Authentication, User Profile, Student Onboarding, Subscription & Payment")

for i, uc in enumerate(use_cases, start=1):
    row = 11 + i
    code = uc['code']
    set_val(ws_stat, row, 1, i)
    cell_b = ws_stat.cell(row, 2)
    cell_b.value = code
    cell_b.hyperlink = f"#'{code}'!A1"
    set_val(ws_stat, row, 3, f"='{code}'!A7")
    set_val(ws_stat, row, 4, f"='{code}'!C7")
    set_val(ws_stat, row, 5, f"='{code}'!F7")
    set_val(ws_stat, row, 6, f"='{code}'!L7")
    set_val(ws_stat, row, 7, f"='{code}'!M7")
    set_val(ws_stat, row, 8, f"='{code}'!N7")
    set_val(ws_stat, row, 9, f"='{code}'!O7")

# Sub total at row 28
set_val(ws_stat, 28, 1, None)
set_val(ws_stat, 28, 2, "Sub total")
set_val(ws_stat, 28, 3, "=SUM(C12:C27)")
set_val(ws_stat, 28, 4, "=SUM(D12:D27)")
set_val(ws_stat, 28, 5, "=SUM(E12:E27)")
set_val(ws_stat, 28, 6, "=SUM(F12:F27)")
set_val(ws_stat, 28, 7, "=SUM(G12:G27)")
set_val(ws_stat, 28, 8, "=SUM(H12:H27)")
set_val(ws_stat, 28, 9, "=SUM(I12:I27)")

# Row 29 blank separator
for c in range(1, 15):
    if not isinstance(ws_stat.cell(29, c), MergedCell):
        ws_stat.cell(29, c).value = None
        ws_stat.cell(29, c).hyperlink = None

# Summary statistics
set_val(ws_stat, 30, 2, "Test coverage")
set_val(ws_stat, 30, 4, "=(C28+D28)*100/I28")
set_val(ws_stat, 30, 5, "%")

set_val(ws_stat, 31, 2, "Test successful coverage")
set_val(ws_stat, 31, 4, "=C28*100/I28")
set_val(ws_stat, 31, 5, "%")

set_val(ws_stat, 32, 2, "Normal case")
set_val(ws_stat, 32, 4, "=F28*100/I28")
set_val(ws_stat, 32, 5, "%")

set_val(ws_stat, 33, 2, "Abnormal case")
set_val(ws_stat, 33, 4, "=G28*100/I28")
set_val(ws_stat, 33, 5, "%")

set_val(ws_stat, 34, 2, "Boundary case")
set_val(ws_stat, 34, 4, "=H28*100/I28")
set_val(ws_stat, 34, 5, "%")

# Clear rows 30 to 34 other columns
for r in range(30, 35):
    for c in [1, 3, 6, 7, 8, 9, 10, 11, 12]:
        cell = ws_stat.cell(r, c)
        if not isinstance(cell, MergedCell):
            cell.value = None
            cell.hyperlink = None

# Clear rows 35 to 110 in Statistics
for r in range(35, 110):
    for c in range(1, 12):
        cell = ws_stat.cell(r, c)
        if not isinstance(cell, MergedCell):
            cell.value = None
            cell.hyperlink = None

# 4. Remove extra sheets (VTFP-17 to VTFP-79)
for i in range(17, 80):
    sheet_name = f'VTFP-{i:02d}'
    if sheet_name in wb.sheetnames:
        del wb[sheet_name]

# 5. Populate and rename each of the 16 sheets (VTFP-01..16 -> LVFS-01..16)
for i, uc in enumerate(use_cases, start=1):
    old_name = f'VTFP-{i:02d}'
    new_name = uc['code']
    ws = wb[old_name]
    ws.title = new_name

    tc_count = len(uc['types'])

    # Unmerge any old merges in rows >= 8
    merges_below_8 = [rng for rng in list(ws.merged_cells.ranges) if rng.min_row >= 8]
    for rng in merges_below_8:
        ws.unmerge_cells(str(rng))

    # Update metadata rows 2..5
    set_val(ws, 2, 1, "Function Code")
    set_val(ws, 2, 3, f"=Functions!E{10+i}")
    set_val(ws, 2, 6, "Function Name")
    set_val(ws, 2, 12, f"=Functions!D{10+i}")

    set_val(ws, 3, 1, "Created By")
    set_val(ws, 3, 3, "youngltc")
    set_val(ws, 3, 6, "Executed By")
    set_val(ws, 3, 12, "youngltc")

    set_val(ws, 4, 1, "Lines  of code")
    set_val(ws, 4, 3, 150)
    set_val(ws, 4, 6, "Lack of test cases")
    set_val(ws, 4, 12, '=IF(Functions!E6<>"N/A",SUM(C4*Functions!E6/1000,-O7),"N/A")')

    set_val(ws, 5, 1, "Test requirement")
    set_val(ws, 5, 3, uc['desc'])

    # Clear rows 9 to 75
    clear_range(ws, 9, 75, 1, 26)

    # Row 9: UTCID headers
    for tc_idx in range(tc_count):
        col = 6 + tc_idx
        cell = ws.cell(9, col)
        cell.value = f"UTCID{tc_idx+1:02d}"
        cell.font = f_tahoma_8_bold_white
        cell.fill = fill_navy
        cell.alignment = align_center

    # Row 10: Condition / Precondition
    set_val(ws, 10, 1, "Condition")
    ws.cell(10, 1).font = f_tahoma_11_bold
    set_val(ws, 10, 2, "Precondition ")
    ws.cell(10, 2).font = f_tahoma_11_bold

    curr_row = 11
    # Preconditions
    for text, applies_to in uc['preconditions']:
        set_val(ws, curr_row, 4, text)
        ws.cell(curr_row, 4).font = f_tahoma_11_regular
        ws.cell(curr_row, 4).alignment = align_left
        ws.cell(curr_row, 4).border = border_thin_bottom
        for tc_idx in range(tc_count):
            col = 6 + tc_idx
            c_cell = ws.cell(curr_row, col)
            c_cell.border = border_thin_bottom
            c_cell.alignment = align_center
            c_cell.font = f_tahoma_11_regular
            if tc_idx in applies_to:
                c_cell.value = "O"
        curr_row += 1

    # Inputs (starting at row 16 or curr_row)
    curr_row = max(curr_row, 16)
    set_val(ws, curr_row, 2, uc['input_label'])
    ws.cell(curr_row, 2).font = f_tahoma_11_bold
    curr_row += 1
    for text, applies_to in uc['inputs']:
        set_val(ws, curr_row, 4, text)
        ws.cell(curr_row, 4).font = f_tahoma_11_regular
        ws.cell(curr_row, 4).alignment = align_left
        ws.cell(curr_row, 4).border = border_thin_bottom
        for tc_idx in range(tc_count):
            col = 6 + tc_idx
            c_cell = ws.cell(curr_row, col)
            c_cell.border = border_thin_bottom
            c_cell.alignment = align_center
            c_cell.font = f_tahoma_11_regular
            if tc_idx in applies_to:
                c_cell.value = "O"
        curr_row += 1

    # Returns (starting at row 24 or curr_row + 1)
    curr_row = max(curr_row + 1, 24)
    set_val(ws, curr_row, 1, "Confirm")
    ws.cell(curr_row, 1).font = f_tahoma_11_bold
    set_val(ws, curr_row, 2, "Return")
    ws.cell(curr_row, 2).font = f_tahoma_11_bold
    for text, applies_to in uc['returns']:
        set_val(ws, curr_row, 4, text)
        ws.cell(curr_row, 4).font = f_tahoma_11_regular
        ws.cell(curr_row, 4).alignment = align_left
        ws.cell(curr_row, 4).border = border_thin_bottom
        for tc_idx in range(tc_count):
            col = 6 + tc_idx
            c_cell = ws.cell(curr_row, col)
            c_cell.border = border_thin_bottom
            c_cell.alignment = align_center
            c_cell.font = f_tahoma_11_regular
            if tc_idx in applies_to:
                c_cell.value = "O"
        curr_row += 1

    # Exceptions (starting at row 31 or curr_row + 1)
    curr_row = max(curr_row + 1, 31)
    set_val(ws, curr_row, 2, "Exception")
    ws.cell(curr_row, 2).font = f_tahoma_11_bold
    for text, applies_to in uc['exceptions']:
        set_val(ws, curr_row, 4, text)
        ws.cell(curr_row, 4).font = f_tahoma_11_regular
        ws.cell(curr_row, 4).alignment = align_left
        ws.cell(curr_row, 4).border = border_thin_bottom
        for tc_idx in range(tc_count):
            col = 6 + tc_idx
            c_cell = ws.cell(curr_row, col)
            c_cell.border = border_thin_bottom
            c_cell.alignment = align_center
            c_cell.font = f_tahoma_11_regular
            if tc_idx in applies_to:
                c_cell.value = "O"
        curr_row += 1

    # Log messages (starting at row 35 or curr_row + 1)
    curr_row = max(curr_row + 1, 35)
    set_val(ws, curr_row, 2, "Log message")
    ws.cell(curr_row, 2).font = f_tahoma_11_bold
    for text, applies_to in uc['logs']:
        set_val(ws, curr_row, 4, text)
        ws.cell(curr_row, 4).font = f_tahoma_11_regular
        ws.cell(curr_row, 4).alignment = align_left
        ws.cell(curr_row, 4).border = border_thin_bottom
        for tc_idx in range(tc_count):
            col = 6 + tc_idx
            c_cell = ws.cell(curr_row, col)
            c_cell.border = border_thin_bottom
            c_cell.alignment = align_center
            c_cell.font = f_tahoma_11_regular
            if tc_idx in applies_to:
                c_cell.value = "O"
        curr_row += 1

    # Dynamic Result Block (at max(curr_row, 40))
    type_row = max(curr_row, 40)
    set_val(ws, type_row, 1, "Result")
    ws.cell(type_row, 1).font = f_tahoma_11_bold
    set_val(ws, type_row, 2, "Type(N : Normal, A : Abnormal, B : Boundary)")
    ws.cell(type_row, 2).font = f_tahoma_11_bold
    ws.merge_cells(start_row=type_row, start_column=2, end_row=type_row, end_column=4)

    for tc_idx, t in enumerate(uc['types']):
        col = 6 + tc_idx
        cell = ws.cell(type_row, col)
        cell.value = t
        cell.font = f_tahoma_11_bold
        cell.alignment = align_center
        cell.border = border_thin_bottom

    pf_row = type_row + 1
    set_val(ws, pf_row, 2, "Passed/Failed")
    ws.cell(pf_row, 2).font = f_tahoma_11_bold
    ws.merge_cells(start_row=pf_row, start_column=2, end_row=pf_row, end_column=4)

    for tc_idx, r in enumerate(uc['results']):
        col = 6 + tc_idx
        cell = ws.cell(pf_row, col)
        cell.value = r
        cell.font = f_tahoma_11_bold
        cell.alignment = align_center
        cell.border = border_thin_bottom

    date_row = pf_row + 1
    set_val(ws, date_row, 2, "Executed Date")
    ws.cell(date_row, 2).font = f_tahoma_11_bold
    ws.merge_cells(start_row=date_row, start_column=2, end_row=date_row, end_column=4)

    for tc_idx in range(tc_count):
        col = 6 + tc_idx
        cell = ws.cell(date_row, col)
        cell.value = datetime.datetime(2026, 9, 27, 0, 0)
        cell.font = f_tahoma_11_regular
        cell.alignment = align_center
        cell.border = border_thin_bottom
        cell.number_format = 'yyyy-mm-dd'

    defect_row = date_row + 1
    set_val(ws, defect_row, 2, "Defect ID")
    ws.cell(defect_row, 2).font = f_tahoma_11_bold
    ws.merge_cells(start_row=defect_row, start_column=2, end_row=defect_row, end_column=4)

    for tc_idx in range(tc_count):
        col = 6 + tc_idx
        cell = ws.cell(defect_row, col)
        cell.border = border_thin_bottom

    # Update summary formulas in row 7
    set_val(ws, 7, 1, f'=COUNTIF(F{pf_row}:HQ{pf_row},"P")')
    set_val(ws, 7, 3, f'=COUNTIF(F{pf_row}:HQ{pf_row},"F")')
    set_val(ws, 7, 6, '=SUM(O7,-A7,-C7)')
    set_val(ws, 7, 12, f'=COUNTIF(E{type_row}:HQ{type_row},"N")')
    set_val(ws, 7, 13, f'=COUNTIF(E{type_row}:HQ{type_row},"A")')
    set_val(ws, 7, 14, f'=COUNTIF(E{type_row}:HQ{type_row},"B")')
    set_val(ws, 7, 15, '=COUNTA(E9:HT9)')

# Ensure exact sequential sheet order: Guideline, Cover, Functions, Statistics, LVFS-01 .. LVFS-16
desired_order = ['Guideline', 'Cover', 'Functions', 'Statistics'] + [f'LVFS-{i:02d}' for i in range(1, 17)]
wb._sheets = [wb[s] for s in desired_order]

wb.save(OUTPUT_DOWNLOADS)
wb.save(OUTPUT_WORKSPACE)

print('Successfully updated workbook with 100% English content and saved to:')
print('  -', OUTPUT_DOWNLOADS)
print('  -', OUTPUT_WORKSPACE)

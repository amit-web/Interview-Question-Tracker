import requests
import sys
import json
from datetime import datetime

class InterviewPrepAPITester:
    def __init__(self, base_url="https://interview-prep-hub-25.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_question_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test{timestamp}@example.com"
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "testpass123",
                "name": "Test User"
            }
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Registered user: {test_email}")
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": "test@example.com",
                "password": "testpass123"
            }
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_question(self):
        """Test creating a new question"""
        success, response = self.run_test(
            "Create Question",
            "POST",
            "questions",
            200,
            data={
                "category": "JavaScript",
                "question": "What is the difference between let, const, and var?",
                "ideal_answer": "**let**: Block-scoped, can be reassigned\n**const**: Block-scoped, cannot be reassigned\n**var**: Function-scoped, can be reassigned",
                "status": "Not Started",
                "notes": "Important for interviews",
                "mistakes_count": 0
            }
        )
        
        if success and 'id' in response:
            self.created_question_id = response['id']
            return True
        return False

    def test_get_questions(self):
        """Test getting all questions"""
        success, response = self.run_test(
            "Get All Questions",
            "GET",
            "questions",
            200
        )
        return success

    def test_get_questions_with_filters(self):
        """Test getting questions with filters"""
        success, response = self.run_test(
            "Get Questions with Category Filter",
            "GET",
            "questions?category=JavaScript",
            200
        )
        
        if not success:
            return False
            
        success2, response2 = self.run_test(
            "Get Questions with Status Filter",
            "GET",
            "questions?status=Not Started",
            200
        )
        
        if not success2:
            return False
            
        success3, response3 = self.run_test(
            "Get Questions with Search",
            "GET",
            "questions?search=let",
            200
        )
        
        return success3

    def test_get_single_question(self):
        """Test getting a single question"""
        if not self.created_question_id:
            print("❌ No question ID available for single question test")
            return False
            
        success, response = self.run_test(
            "Get Single Question",
            "GET",
            f"questions/{self.created_question_id}",
            200
        )
        return success

    def test_update_question(self):
        """Test updating a question"""
        if not self.created_question_id:
            print("❌ No question ID available for update test")
            return False
            
        success, response = self.run_test(
            "Update Question",
            "PUT",
            f"questions/{self.created_question_id}",
            200,
            data={
                "status": "In Progress",
                "notes": "Updated notes with more details",
                "mistakes_count": 1,
                "last_revised_at": datetime.now().isoformat()
            }
        )
        return success

    def test_smart_revision_list(self):
        """Test smart revision algorithm"""
        success, response = self.run_test(
            "Smart Revision List",
            "GET",
            "questions/smart-revision/list",
            200
        )
        return success

    def test_category_progress(self):
        """Test category progress endpoint"""
        success, response = self.run_test(
            "Category Progress",
            "GET",
            "progress/categories",
            200
        )
        return success

    def test_streak_update(self):
        """Test streak update"""
        success, response = self.run_test(
            "Update Streak",
            "POST",
            "streak/update",
            200
        )
        return success

    def test_export_json(self):
        """Test JSON export"""
        success, response = self.run_test(
            "Export JSON",
            "GET",
            "export/json",
            200
        )
        return success

    def test_import_json(self):
        """Test JSON import"""
        success, response = self.run_test(
            "Import JSON",
            "POST",
            "import/json",
            200,
            data={
                "questions": [
                    {
                        "category": "React",
                        "question": "What is the difference between state and props?",
                        "ideal_answer": "State is internal component data, props are passed from parent",
                        "status": "Not Started",
                        "notes": "Fundamental React concept",
                        "mistakes_count": 0
                    }
                ]
            }
        )
        return success

    def test_delete_question(self):
        """Test deleting a question"""
        if not self.created_question_id:
            print("❌ No question ID available for delete test")
            return False
            
        success, response = self.run_test(
            "Delete Question",
            "DELETE",
            f"questions/{self.created_question_id}",
            200
        )
        return success

    def test_unauthorized_access(self):
        """Test unauthorized access"""
        original_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Unauthorized Access (should fail)",
            "GET",
            "questions",
            401
        )
        
        self.token = original_token
        return success

def main():
    print("🚀 Starting Interview Prep Tracker API Tests")
    print("=" * 60)
    
    tester = InterviewPrepAPITester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("User Registration", tester.test_register),
        ("Get Current User", tester.test_get_me),
        ("Create Question", tester.test_create_question),
        ("Get All Questions", tester.test_get_questions),
        ("Get Questions with Filters", tester.test_get_questions_with_filters),
        ("Get Single Question", tester.test_get_single_question),
        ("Update Question", tester.test_update_question),
        ("Smart Revision List", tester.test_smart_revision_list),
        ("Category Progress", tester.test_category_progress),
        ("Streak Update", tester.test_streak_update),
        ("Export JSON", tester.test_export_json),
        ("Import JSON", tester.test_import_json),
        ("Unauthorized Access", tester.test_unauthorized_access),
        ("Delete Question", tester.test_delete_question),
    ]
    
    # Also test login with existing credentials
    print("\n🔄 Testing login with existing credentials...")
    login_tester = InterviewPrepAPITester()
    login_success = login_tester.test_login()
    if login_success:
        print("✅ Login with existing credentials successful")
    else:
        print("❌ Login with existing credentials failed")
    
    # Run all tests
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if login_success:
        print("✅ Login functionality working")
    else:
        print("❌ Login functionality not working")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 API tests mostly successful!")
        return 0
    else:
        print("⚠️  Multiple API issues detected")
        return 1

if __name__ == "__main__":
    sys.exit(main())
## Post_Sphere
### Post_Sphere is a secure login and user authentication system built with Node.js and Express.js. It features password hashing (bcrypt), JWT-based session management, and MongoDB integration to securely store user credentials. Users can log in, access their profile, and post their thoughts.

# Features
✅ User Authentication – Secure login and registration
✅ Password Hashing – Uses bcrypt for security
✅ JWT Session Management – Secure user sessions
✅ MongoDB Integration – Efficient data storage
✅ User Profile – View and edit profile after login
✅ Post Thoughts – Share thoughts on the platform

# Tech Stack
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose ORM)
- Authentication: bcrypt, JWT
- Frontend: HTML, CSS, JavaScript

# Installation & Setup
1. Clone the repository :
- git clone https://github.com/your-username/Post_Sphere.git
- cd Post_Sphere
2. Install dependencies :
- npm install
3. Set up environment variables (.env file):
- MONGO_URI=your_mongodb_connection_string
- JWT_SECRET=your_secret_key
4. Run the server:
- node server.js
- Open http://localhost:3000 in your browser.

# Security Enhancements
- Input validation (Prevents SQL/NoSQL injection)
- Rate limiting (Prevents brute-force attacks)
- HTTPS enforcement (Recommended for production)

# Contributing
- Feel free to fork this repo, raise issues, or submit pull requests!

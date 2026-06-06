# Developer-Match-Maker

An app designed to help developers showcase their skill graphs and automatically match them with active GitHub open-source issues that fit their stack and experience level.

## 🎯 Overview

Developer-Match-Maker is a platform that bridges the gap between aspiring developers looking to contribute to open-source projects and maintainers seeking qualified contributors. The app analyzes your technical skills and experience, then intelligently matches you with suitable GitHub issues across thousands of projects.

## ✨ Features

- **Skill Showcase**: Create a comprehensive profile displaying your technical skills, programming languages, frameworks, and experience level
- **Smart Matching Algorithm**: Get matched with open-source issues based on your specific skill set and experience
- **GitHub Integration**: Seamlessly connect with GitHub to discover real, active issues from actual repositories
- **Experience Level Filtering**: Find issues tailored to your experience level (beginner, intermediate, advanced)
- **Stack Alignment**: Match issues that use the technologies and languages you know best
- **Contribution Tracking**: Monitor your contributions and build your open-source portfolio

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- A GitHub account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rakesh0z/Developer-Match-Maker.git
cd Developer-Match-Maker
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

### Running the Application

#### Development

**Terminal 1 - Start the server:**
```bash
cd server
npm start
```

**Terminal 2 - Start the client:**
```bash
cd client
npm run dev
```

The application will be available at `http://localhost:5173`

#### Production Build

```bash
# Build client
cd client
npm run build

# Build server
cd server
npm run build
```

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)
- Modern React application with TypeScript for type safety
- Vite for fast development and optimized builds
- ESLint configuration for code quality

### Backend (Node.js)
- Express server for API endpoints
- GitHub API integration for fetching and analyzing issues
- Skill matching algorithm engine

## 💡 How It Works

1. **Profile Creation**: Users create a profile and input their skills, programming languages, and experience level
2. **Skill Analysis**: The system analyzes and stores the developer's skill graph
3. **GitHub Scanning**: The platform queries GitHub for open-source issues matching specified criteria
4. **Matching Engine**: An intelligent algorithm matches issues with the developer's profile
5. **Recommendations**: Users receive personalized recommendations for issues they can contribute to

## 📁 Project Structure

```
Developer-Match-Maker/
├── client/              # React frontend application
│   ├── src/
│   ├── public/
│   └── package.json
├── server/              # Node.js backend
│   ├── src/
│   ├── routes/
│   └── package.json
└── README.md
```

## 🔌 API Integration

- **GitHub API**: Used to fetch open-source issues and repository data
- **Authentication**: OAuth integration for secure GitHub connection

## 🤝 Contributing

We welcome contributions! Please feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋 Support

For questions or issues, please open an issue on GitHub or contact the project maintainers.

## 🌟 Future Enhancements

- Advanced filtering and search capabilities
- Real-time notifications for new matching issues
- Contributor leaderboard and gamification
- Integration with multiple platforms beyond GitHub
- Machine learning for improved matching accuracy
- Community forums for contributor support

---

**Happy contributing! 🚀**

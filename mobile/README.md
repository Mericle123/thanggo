# Thanggo Mobile App

The Thanggo mobile application is a React Native app built with Expo that connects to the ThangGo backend for a comprehensive sports platform experience in Bhutan.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Expo CLI** - Install globally with: `npm install -g expo-cli`
- **Expo Go app** (for mobile testing) - Available on [iOS App Store](https://apps.apple.com/us/app/expo-go/id1108981234) and [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 🚀 Installation

### 1. Clone or Navigate to the Mobile Directory
```bash
cd mobile
```

### 2. Install Dependencies
```bash
npm install
```

This will install all required packages including:
- React & React Native
- Expo and related packages
- React DOM for web support
- Expo Vector Icons for UI components
- Expo Linear Gradient for styling

## ▶️ Running the Application

### Start the Development Server
```bash
npm start
```

This will start the Expo Metro bundler and display a QR code in your terminal.

### Run on Different Platforms

#### 📱 **iOS (Simulator)**
```bash
npm run ios
```
- Requires macOS with Xcode installed
- Opens iOS simulator automatically
- Great for testing on Apple devices

#### 🤖 **Android (Emulator)**
```bash
npm run android
```
- Requires Android Studio and Android Emulator configured
- Opens Android emulator automatically
- Perfect for testing on Android devices

#### 🌐 **Web Browser**
```bash
npm run web
```
- Opens the app in your default web browser
- Accessible at `http://localhost:8081`
- Great for quick testing and debugging

#### 📲 **Physical Device with Expo Go**
After running `npm start`:
1. Open the **Expo Go** app on your phone
2. Scan the QR code displayed in the terminal
3. Wait for the app to load on your device

**iOS Devices:** Use the camera app to scan the QR code  
**Android Devices:** Open Expo Go and tap "Scan QR code"

## 🏗️ Project Structure

```
mobile/
├── App.js                 # Main application entry point
├── index.js              # App initialization
├── app.json              # Expo configuration
├── package.json          # Dependencies and scripts
├── assets/               # Images, fonts, and other static assets
├── scripts/
│   └── serve-dist.js     # Build distribution scripts
└── README.md             # This file
```

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run ios` | Launch iOS simulator |
| `npm run android` | Launch Android emulator |
| `npm run web` | Open web version in browser |

## 📦 Tech Stack

- **Framework:** React Native with Expo
- **UI Library:** React DOM
- **Icons:** Expo Vector Icons
- **Styling:** Expo Linear Gradient
- **Environment:** Expo SDK 56.0.9

## 🔗 Backend Connection

The mobile app connects to the ThangGo backend API running on `http://localhost:4000`. Make sure the backend server is running before using the app.

To start the backend:
```bash
cd ../backend
npm run dev
```

The backend will be available at:
- **API:** `http://localhost:4000/api`
- **WebSocket:** `ws://localhost:4000`

## 📸 App Features

- User authentication and profile management
- Sports venue discovery
- Squad management
- Real-time messaging with Socket.IO
- Venue booking and scheduling
- User search and follow system

## ⚠️ Troubleshooting

### Metro Bundler Issues
If the Metro bundler fails to start:
```bash
npm start -- --reset-cache
```

### Dependency Issues
Clear node_modules and reinstall:
```bash
rm -rf node_modules
npm install
```

### Port Already in Use
If port 8081 is already in use, Expo will automatically use another port. Check the terminal output for the correct URL.

### Cannot Connect to Backend
- Ensure the backend is running on port 4000
- Check your device's network connection
- Verify the backend URL in your app configuration

## 📝 Notes

- Hot reloading is enabled by default - changes will appear instantly
- Press `?` in the terminal during `npm start` to see all available commands
- Use `Ctrl+C` to stop the development server
- For production builds, refer to Expo's [building guide](https://docs.expo.dev/build/setup/)

## 🤝 Contributing

When making changes to the mobile app:
1. Keep the backend server running
2. Test on multiple platforms (iOS, Android, Web)
3. Verify real-time features work correctly
4. Check for console errors

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Vector Icons](https://icons.expo.fyi/)
- [ThangGo Backend README](../backend/README.md)

## 📧 Support

For issues or questions, please refer to the main project documentation or contact the development team.

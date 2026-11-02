module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@app': './src/app',
          '@navigation': './src/navigation',
          '@features': './src/features',
          '@shared': './src/shared',
          '@store': './src/store',
          '@types': './src/types',
          '@assets': './assets',
          '@expo/vector-icons': './src/shared/compat/vectorIcons',
          'expo-linear-gradient': './src/shared/compat/linearGradient',
          '@react-native-masked-view/masked-view': './src/shared/compat/maskedView',
          'expo-router': './src/shared/compat/expoRouter',
        },
      },
    ],
  ],
};

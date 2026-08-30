import React from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet, useColorScheme } from "react-native";
import { Typography, Colors } from '../constants/theme';
import { useNavigation } from 'expo-router';
  
export default function IconAndTitle() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[colorScheme];
  return(
    <View style={styles.iconAndTitle}>
        <Image source={require('../../assets/images/icon.jpeg')} style={styles.logoImage} resizeMode="contain" />
        <View style={styles.title}>
          <Text style={[styles.logoText, {color: themeColors.text} ]}>better</Text>
          <Text style={[styles.logoText, {color: themeColors.backgroundSelected} ]}>meet</Text>
        </View>              
    </View>
  );
}

const styles = StyleSheet.create({
  iconAndTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  logoImage: {
    width: 45,
    height: 45,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
  },  
});
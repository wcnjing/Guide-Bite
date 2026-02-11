import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(
        cameraStatus.status === 'granted' && libraryStatus.status === 'granted'
      );
    })();
  }, []);

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        await sendToRoboflow(result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo: ' + error.message);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        await sendToRoboflow(result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const sendToRoboflow = async (base64Image) => {
    setLoading(true);
    setResults(null);

    try {
      const apiKey = process.env.EXPO_PUBLIC_ROBOFLOW_API_KEY;
      const workspace = process.env.EXPO_PUBLIC_ROBOFLOW_WORKSPACE;
      const workflow = process.env.EXPO_PUBLIC_ROBOFLOW_WORKFLOW;

      const url = `https://detect.roboflow.com/infer/workflows/${workspace}/${workflow}`;

      console.log('Sending to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          inputs: {
            image: {
              type: 'base64',
              value: base64Image,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Full API Response:', JSON.stringify(data, null, 2));
      
      // Check if data has outputs array
      if (data.outputs) {
        console.log('Outputs found:', data.outputs);
        setResults(data.outputs);
      } else {
        console.log('Using direct data:', data);
        setResults(data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process image: ' + error.message);
      console.error('Roboflow error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera or photo library</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Roboflow Vision</Text>
        <Text style={styles.subtitle}>Take or pick a photo to analyze</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonText}>📷 Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={pickImage}>
            <Text style={styles.buttonText}>🖼️ Pick from Library</Text>
          </TouchableOpacity>
        </View>

        {image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image.uri }} style={styles.image} />
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Analyzing image...</Text>
          </View>
        )}

        {results && !loading && (
          <View style={styles.resultsContainer}>
            {/* Clean Classification Result */}
            {(results.top_class || results[0]?.top_class) && (
              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>Detected:</Text>
                <Text style={styles.resultValue}>
                  {results.top_class || results[0]?.top_class || 'Unknown'}
                </Text>
                {(results.classification_predictions?.confidence || results[0]?.classification_predictions?.confidence) && (
                  <View style={styles.confidenceBar}>
                    <View 
                      style={[
                        styles.confidenceFill, 
                        { width: `${((results.classification_predictions?.confidence || results[0]?.classification_predictions?.confidence) * 100)}%` }
                      ]} 
                    />
                  </View>
                )}
                {(results.classification_predictions?.confidence || results[0]?.classification_predictions?.confidence) && (
                  <Text style={styles.confidenceText}>
                    {((results.classification_predictions?.confidence || results[0]?.classification_predictions?.confidence) * 100).toFixed(1)}% confidence
                  </Text>
                )}
              </View>
            )}

            {/* Output Image (if available) */}
            {(results.output_image?.value || results[0]?.output_image?.value) && (
              <View style={styles.outputImageContainer}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${results.output_image?.value || results[0]?.output_image?.value}` }}
                  style={styles.outputImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Debug button */}
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => {
                console.log('Results:', results);
                Alert.alert('Debug', JSON.stringify(results, null, 2));
              }}
            >
              <Text style={styles.debugButtonText}>🐛 Debug Info</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: '#8b5cf6',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 16,
  },
  resultsContainer: {
    width: '100%',
    marginTop: 20,
  },
  resultCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 32,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#6366f1',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  resultLabel: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  confidenceBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  outputImageContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  outputImage: {
    width: '100%',
    height: 300,
  },
  debugButton: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  debugButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
});
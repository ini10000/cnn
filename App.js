import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  StatusBar,
  Image,
  TouchableOpacity,
} from "react-native";
import * as tf from "@tensorflow/tfjs";
import {
  decodeJpeg,
  bundleResourceIO,
  fetch,
} from "@tensorflow/tfjs-react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

import * as mobilenet from "@tensorflow-models/mobilenet";
import Constants from "expo-constants";
import * as Permissions from "expo-permissions";
import * as jpeg from "jpeg-js";

class App extends React.Component {
  state = {
    isTfReady: false,
    isModelReady: false,
    predictions: null,
    image: null,
  };

  getPermissionAsync = async () => {
    if (Constants.platform.ios) {
      const { status } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);
      if (status !== "granted") {
        alert("Sorry, we need camera roll permissions to make this work!");
      }
    }
  };

  async componentDidMount() {
    await tf.ready();
    this.setState({
      isTfReady: true,
    });
    this.model = await mobilenet.load();
    // const modelJson = await require("./assets/model/model.json");
    // const modelWeight = await require("./assets/model/group1-shard1of1.bin");
    // this.model = await tf.loadLayersModel(
    //   bundleResourceIO(modelJson, modelWeight)
    // );
    this.setState({ isModelReady: true });
    this.getPermissionAsync();
  }

  classifyImage = async () => {
    try {
      const fileUri = Image.resolveAssetSource(this.state.image).uri;
      const imgB64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const imgBuffer = tf.util.encodeString(imgB64, "base64").buffer;
      const raw = new Uint8Array(imgBuffer);
      const imageTensor = decodeJpeg(raw);
      const predictions = await this.model.classify(imageTensor);
      this.setState({ predictions });
    } catch (error) {
      console.log(error);
    }
  };

  selectImage = async () => {
    try {
      let response = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!response.cancelled) {
        const source = { uri: response.uri };
        this.setState({ image: source });
        this.classifyImage();
      }
    } catch (error) {
      console.log(error);
    }
  };

  renderPrediction = (prediction) => {
    return (
      <Text key={prediction.className} style={styles.text}>
        {prediction.className}
      </Text>
    );
  };

  render() {
    const { isTfReady, isModelReady, predictions, image } = this.state;

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={[styles.poweredBy, styles.header]}>CNN-SLR</Text>
          <Text style={{ ...styles.text, marginBottom: 40 }}>
            An image recognition app
          </Text>
          <Text style={styles.text}>
            TFJS ready? {isTfReady ? <Text>✅</Text> : ""}
          </Text>

          <View style={styles.loadingModelContainer}>
            <Text style={styles.text}>Model ready? </Text>
            {isModelReady ? (
              <Text style={styles.text}>✅</Text>
            ) : (
              <ActivityIndicator size="small" />
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.imageWrapper}
          onPress={isModelReady ? this.selectImage : undefined}
        >
          {image && <Image source={image} style={styles.imageContainer} />}

          {isModelReady && !image && (
            <Text style={styles.transparentText}>Tap to select image</Text>
          )}
        </TouchableOpacity>
        <View style={styles.predictionWrapper}>
          {isModelReady && image && (
            <Text style={styles.text}>
              Predictions: {predictions ? "" : "Predicting..."}
            </Text>
          )}
          {isModelReady &&
            predictions &&
            predictions.map((p) => this.renderPrediction(p))}
        </View>
        <View style={styles.footer}>
          <Text style={styles.poweredBy}>Powered by:</Text>
          <Text style={styles.text}>Inicodes © 2022</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171f24",
    alignItems: "center",
  },
  loadingContainer: {
    marginTop: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 32,
  },
  text: {
    color: "#ffffff",
    fontSize: 16,
  },
  loadingModelContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  imageWrapper: {
    width: 280,
    height: 280,
    padding: 10,
    borderColor: "#cf667f",
    borderWidth: 5,
    borderStyle: "dashed",
    marginTop: 40,
    marginBottom: 10,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: 250,
    height: 250,
    position: "absolute",
    top: 10,
    left: 10,
    bottom: 10,
    right: 10,
  },
  predictionWrapper: {
    height: 100,
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
  },
  transparentText: {
    color: "#ffffff",
    opacity: 0.7,
  },
  footer: {
    marginTop: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  poweredBy: {
    fontSize: 20,
    color: "#e69e34",
    marginBottom: 6,
  },
  tfLogo: {
    width: 125,
    height: 70,
  },
});

export default App;

import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default class App extends Component {
  static instances = [];

  static get instance() {
    return App.instances[0];
  }

  constructor(props) {
    super(props);
    this.state = {
      geolocation: "waiting for geolocation ..."
    };
    App.instances.push(this);

    this.getGeolocation();
    // call the method every 60 seconds
    setInterval(this.getGeolocation, 60000);
  }

  getGeolocation() {
    navigator.geolocation.getCurrentPosition((locationInfo) => {
      console.log(locationInfo);
      App.instance.setState(
        {geolocation: JSON.stringify(locationInfo.coords)}
      );
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>{this.state.geolocation}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

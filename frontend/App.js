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
    
    // this.getUsers('192.168.254.10', '3000');
  }

  getGeolocation() {
    navigator.geolocation.getCurrentPosition((locationInfo) => {
      console.log(locationInfo);
      App.instance.setState(
        {geolocation: JSON.stringify(locationInfo.coords)}
      );
    });
  }

  async getUsers() {
    try {
      let response = await fetch(
        `http://${hostname}:${port}/api/users`
        // 'http://localhost:3000/api/users'
      );
      let responseJson = JSON.parse(await response.text());
      console.log(responseJson);
      return responseJson
    } catch (error) {
      console.error(error);
    }
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

import React from 'react';
import PropTypes from "prop-types";
import AddFishForm from './AddFishForm';
import EditFishForm from './EditFishForm';
import Login from './Login';
import base, { firebaseApp } from "../base";
import firebase from 'firebase';

class Inventory extends React.Component {
  static propTypes = {
    fishes: PropTypes.shape({
      key: PropTypes.string
    }),
    addFish: PropTypes.func,
    updateFish: PropTypes.func,
    deleteFish: PropTypes.func,
    loadSampleFishes: PropTypes.func
  };

  state = {
    uid: null,
    owner: null
  }

  componentDidMount() {
    firebase.auth().onAuthStateChanged(user => {
      if(user) {
        this.authHandler({ user });
      }
    })
  }

  authHandler = async (authData) => {
    // 1. lookup the current store in the firebase DB
    const store = await base.fetch(this.props.storeId, {context: this});
    // 2. claim the store if there is no owner
    if (!store.owner) {
      // save it as our own
      await base.post(`${this.props.storeId}/owner`, {
        data: authData.user.uid
      });
    }
    // 3. set the state of the inventory component to reflect the current user
    this.setState({
      uid: authData.user.uid,
      owner: store.owner || authData.user.uid
    });
  }

  authenticate = provider => {
    const authProvider = new firebase.auth[`${provider}AuthProvider`]();
    firebaseApp
      .auth()
      .signInWithPopup(authProvider)
      .then(this.authHandler);
  }

  logout = async () => {
    await firebase.auth().signOut();
    this.setState({ uid: null })
  }

  render() {
    const logout = <button onClick={this.logout}>Log Out!</button>
    // check for current user
    if (!this.state.uid) {
      return <Login authenticate={this.authenticate} />
    }

    // check if user is the owner
    if (this.state.uid !== this.state.owner) {
      return (
        <div>
          <p>Sorry, you can't manage this store.</p>
          {logout}
        </div>
      );
    }

    // they must be the owner so show them the inventory
    return (
      <div className="inventory-container">
        <h2>Inventory</h2> 
        {logout}
        { Object.keys(this.props.fishes).map(key => (
          <EditFishForm 
            key={key} 
            fish={this.props.fishes[key]} 
            index={key}
            updateFish={this.props.updateFish} 
            deleteFish={this.props.deleteFish}
          />
        ))}
        <AddFishForm addFish={this.props.addFish} />
        <button onClick={this.props.loadSampleFishes}>
          Load Samples
        </button>
      </div> 
    ) 
  }
}

export default Inventory
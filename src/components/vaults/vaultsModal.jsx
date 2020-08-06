import React, { Component } from "react";
import {
  DialogContent,
  Dialog,
  Slide
} from '@material-ui/core';

import Vaults from './vaults.jsx';

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

class VaultsModal extends Component {
  render() {
    const { closeModal, modalOpen } = this.props;

    const fullScreen = window.innerWidth < 450;

    return (
      <Dialog open={ modalOpen } onClose={ closeModal } fullWidth={ true } maxWidth={ 'md' } TransitionComponent={ Transition } fullScreen={ fullScreen }>
        <DialogContent>
          <Vaults closeModal={ closeModal } />
        </DialogContent>
      </Dialog>
    )
  };
}

export default VaultsModal;

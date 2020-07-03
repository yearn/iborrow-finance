import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import {
  Tabs,
  Tab
} from '@material-ui/core';

const styles = theme => ({
  root: {
    verticalAlign: 'top',
    width: '100%',
  }
});

function Header(props) {
  const {
    classes,
    setHeaderValue
  } = props;

  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    setHeaderValue(newValue)
  };

  return (
    <div className={ classes.root }>
      <Tabs
        value={value}
        onChange={handleChange}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
        aria-label="full width tabs example"
      >
        <Tab label="Supply Collateral" {...a11yProps(0)} />
        <Tab label="Borrowing" {...a11yProps(1)} />
        <Tab label="Something Else" {...a11yProps(2)} />
      </Tabs>
    </div>
  )
}

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

export default withStyles(styles)(Header);

import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import {
  Tabs,
  Tab,
  Typography
} from '@material-ui/core';
import { colors } from '../../theme'

const styles = theme => ({
  root: {
    verticalAlign: 'top',
    width: '100%',
    display: 'flex',
  },
  earn: {
    flex: '1',
    height: '75px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: colors.pink,
    '&:hover': {
      backgroundColor: "#f9fafb",
      '& .title': {
        color: colors.pink
      },
      '& .icon': {
        color: colors.pink
      }
    },
    '& .title': {
      color: colors.white
    },
    '& .icon': {
      color: colors.white
    },
  },
  zap: {
    flex: '1',
    height: '75px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: colors.lightBlue,
    '&:hover': {
      backgroundColor: "#f9fafb",
      '& .title': {
        color: colors.lightBlue,
      },
      '& .icon': {
        color: colors.lightBlue
      }
    },
    '& .title': {
      color: colors.white
    },
    '& .icon': {
      color: colors.white
    },
  },
  apr: {
    flex: '1',
    height: '75px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: colors.lightBlack,
    '&:hover': {
      backgroundColor: "#f9fafb",
      '& .title': {
        color: colors.lightBlack
      },
      '& .icon': {
        color: colors.lightBlack
      }
    },
    '& .title': {
      color: colors.white
    },
    '& .icon': {
      color: colors.white
    }
  },
  active: {
    borderBottom: '4px solid white',
    padding: '10px 0px'
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
      <div className={ `${classes.earn}` } onClick={ () => { props.setHeaderValue(0) } }>
        <Typography variant={'h3'} className={ `${classes.title} title` }>Collateral</Typography>
      </div>
      <div className={ `${classes.zap}` } onClick={ () => { props.setHeaderValue(1) } }>
        <Typography variant={'h3'} className={ `${classes.title} title` }>Borrowing</Typography>
      </div>
      <div className={ `${classes.apr}` } onClick={ () => { props.setHeaderValue(2) } }>
        <Typography variant={'h3'} className={ (value===2?`${classes.title} title ${classes.active}`:`${classes.title} title`) }>Other</Typography>
      </div>
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

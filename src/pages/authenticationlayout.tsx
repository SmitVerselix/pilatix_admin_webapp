import { Fragment, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Switcher from '../components/common/switcher/switcher';
import 'preline/preline';
import { IStaticMethods } from 'preline/preline';
import { Initialload } from '../components/common/contextapi';

declare global {
  interface Window {
    HSStaticMethods: IStaticMethods;
  }
}

const Authenticationlayout = () => {
  const location = useLocation();

  useEffect(() => {
    window.HSStaticMethods.autoInit();
  }, [location.pathname]);

  const [pageloading, setpageloading] = useState(false);

  return (
    <Fragment>
      <Initialload.Provider value={{ pageloading, setpageloading }}>
        <Switcher />
        <Outlet />
      </Initialload.Provider>
    </Fragment>
  );
};

export default Authenticationlayout;

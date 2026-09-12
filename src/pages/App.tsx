import { Fragment,  useEffect,  useState } from "react"
import Switcher from "../components/common/switcher/switcher";
import Header from "../components/common/header/header";
import Sidebar from "../components/common/sidebar/sidebar";
import { ThemeChanger } from "../redux/action";
import store from "../redux/store";
import Footer from "../components/common/footer/footer";
import Backtotop from "../components/common/backtotop/backtotop"; 
import { Outlet, useLocation } from "react-router-dom";
import "preline/preline";
import { IStaticMethods } from "preline/preline";
import { Initialload } from "../components/common/contextapi";

declare global {
  interface Window {
    HSStaticMethods: IStaticMethods;
  }
}
const App = () => {

  const [_MyclassName, setMyClass] = useState("");

  const Bodyclickk = () => {
    const theme = store.getState();
    if (localStorage.getItem("ynexverticalstyles") == "icontext") {
      setMyClass("");
    }
    if (window.innerWidth > 992) {
      if (theme.iconOverlay === 'open') {
        ThemeChanger({ ...theme, iconOverlay: "" });
      }
    }
  }

  const [lateLoad, setlateLoad] = useState(false);
  useEffect(() => {
	  setlateLoad(true);
	});

  const location = useLocation();

  useEffect(() => {
    window.HSStaticMethods.autoInit();
  }, [location.pathname]);
  
  const [pageloading, setpageloading] = useState(false)
  return (
    <>
    <Fragment>
    <Initialload.Provider value={{ pageloading, setpageloading }}>
            <div style={{display: `${lateLoad ? 'block' : 'none'}`}}>
                    <Switcher/>
                  <div className='page'>
                    <Header/>
                    <Sidebar/>
                    <div className='content'>
                      <div className='main-content'  onClick={Bodyclickk}>
                      <Outlet/>
                      </div>
                    </div>
                    <Footer/>
                  </div>
                  <Backtotop/>
            </div>
        </Initialload.Provider>
    </Fragment>
    </>
  )
}


export default App;

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import WelcomePage from '@mods/WelcomePage';
import storageManager from '@src/util/libs/Localstorage';

import * as auth from '../../../client/action/auth';
import cons from '../../../client/state/cons';
import { getUrlParams } from '../../../util/common';
import Avatar from '../../atoms/avatar/Avatar';

import LoadingScreen from './modules/LoadingScreen';
import AuthCard from './modules/AuthCard';
import Welcome from '../../../../mods/agi-mod/bots/Welcome';
import ElectronSidebar from '../client/ElectronSidebar';
import { AuthDivBaseWithBanner } from './modules/AuthDivBase';
import LoadingPage from '../client/Loading';

function Auth({ isDevToolsOpen = false }) {
  const [loginToken, setLoginToken] = useState(getUrlParams('loginToken'));
  const [type, setType] = useState('login');
  const [isWelcome, setIsWelcome] = useState(WelcomePage.enabled);

  useEffect(() => {
    const authSync = async () => {
      if (!loginToken) return;
      if (storageManager.getItem(cons.secretKey.BASE_URL) === undefined) {
        setLoginToken(null);
        return;
      }
      const baseUrl = storageManager.getItem(cons.secretKey.BASE_URL);
      try {
        await auth.loginWithToken(baseUrl, loginToken);

        const { href } = window.location;
        window.location.replace(href.slice(0, href.indexOf('?')));
      } catch {
        setLoginToken(null);
      }
    };

    authSync();
  }, []);

  const showLoginPage = !isWelcome || !WelcomePage.html || loginToken;
  return (
    <>
      <LoadingPage />
      {loginToken && <LoadingScreen message="Redirecting..." />}
      {!loginToken && (
        <>
          <AuthCard />
          <Welcome isGuest />
        </>
      )}
    </>
  );
}

Auth.propTypes = {
  isDevToolsOpen: PropTypes.bool,
};

export default Auth;

import React from 'react';
import * as ReactDOM from 'react-dom/client';
import clone from 'clone';
import { Buffer } from 'buffer';
import { startCustomThemes } from '@mods';

import startQuery from './util/libs/jquery';

import { startSettings } from './client/state/settings';
import { getPWADisplayMode, installPWA } from './util/pwa/installer.js';

import App from './app/pages/App';
import { getOsSettings } from './util/libs/osSettings';
import ChatRoom from './app/embed/ChatRoom';
import urlParams from './util/libs/urlParams';

global.Buffer = Buffer;
// global.Buffer = global.Buffer || Buffer;
function StartApp(appProtocol) {
  global.getEnvApp = () => clone(__ENV_APP__);

  const pageType = urlParams.get('type');
  const pageId = urlParams.get('id');

  const osSettings = getOsSettings();
  startCustomThemes();
  startSettings();

  getPWADisplayMode();
  installPWA();
  startQuery();

  const root = ReactDOM.createRoot(document.getElementById('root'));

  if (
    typeof pageType === 'string' &&
    pageType.length > 0 &&
    typeof pageId === 'string' &&
    pageId.length > 0
  ) {
    if (pageType === 'chatroom') {
      const hs = urlParams.get('hs');
      return root.render(
        <ChatRoom
          roomId={pageId}
          homeserver={typeof hs === 'string' && hs.length ? hs : null}
          joinGuest={urlParams.get('join_guest')}
          refreshTime={urlParams.get('refresh_time')}
          usernameHover={urlParams.get('username_hover')}
          theme={urlParams.get('theme')}
        />,
      );
    }

    return root.render('');
  }

  console.log(`[app] Starting app using the protocol "${appProtocol}" mode.`);
  if (osSettings.startMinimized && typeof global.electronWindow.setIsVisible === 'function') {
    global.electronWindow.setIsVisible(false);
  }

  return root.render(<App />);
}

export default StartApp;

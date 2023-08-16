import fs from 'fs';
import path from 'path';
import { app, Notification } from 'electron';

import deleteAllFilesInDir from '../../fs/deleteAllFilesInDir';
import { objType } from '../../../src/util/tools';

// Validate Folders
const tempFolder = path.join(app.getPath('temp'), './pony-house-matrix');
if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder);
}

const tempFolderNoti = path.join(tempFolder, './notification');
if (!fs.existsSync(tempFolderNoti)) {
    fs.mkdirSync(tempFolderNoti);
}

deleteAllFilesInDir(tempFolderNoti);
const notifications = {};

// Events
const filterEvent = (event) => {

    const tinyE = {};
    // for (const item in event) {
    //     if (objType(event, 'object')) {
    //         tinyE[item] = event[item];
    //     }
    // }

    return tinyE;

};

// Engines
const engines = {

    // Electron
    default: (e, tag, tinyData, closeNoti) => {

        notifications[tag] = new Notification(tinyData);

        notifications[tag].on('show', (event) => e.reply('tiny-notification-show', { tag, event: filterEvent(event) }));
        notifications[tag].on('click', (event) => e.reply('tiny-notification-click', { tag, event: filterEvent(event) }));
        notifications[tag].on('reply', (event, reply) => e.reply('tiny-notification-reply', { tag, event: filterEvent(event), reply }));
        notifications[tag].on('action', (event, index) => e.reply('tiny-notification-action', { tag, event: filterEvent(event), index }));
        notifications[tag].on('failed', (event, error) => e.reply('tiny-notification-failed', { tag, event: filterEvent(event), error }));

        notifications[tag].on('close', closeNoti);

    }

};

// Create Start
const createNotification = (e, data) => {

    // Prepare Data
    const tinyData = {};
    const tag = data.tag;
    for (const item in data) {
        if (item !== 'tag' && item !== 'timeout') {
            tinyData[item] = data[item];
        }
    }

    let timeout = data.timeout;
    if (typeof timeout !== 'number' || Number.isNaN(timeout) || !Number.isFinite(timeout)) {
        timeout = 15000;
    } else if (timeout < 0) {
        timeout = 0;
    }

    // Close Event
    const closeNoti = (event, forceClose) => {
        try {
            if (notifications[tag]) {

                delete notifications[tag];
                e.reply(`tiny-notification-close${forceClose ? '-timeout' : ''}`, { tag, event: filterEvent(event) });

                if (data.iconFromWeb && typeof data.iconFile === 'string') {

                    const filePath = path.join(tempFolderNoti, `./${data.iconFile}`);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                }

            }
        } catch (err) {
            console.error(err);
        }
    };

    // Select Engine
    const closeTimeout = setTimeout(() => closeNoti({}, true), timeout);
    if (typeof data.engine !== 'string' || !engines[data.engine]) {
        engines.default(e, tag, tinyData, closeNoti);
    } else {
        engines[data.engine](e, tag, tinyData, closeNoti, timeout, closeTimeout);
    }

    // Send Confirm
    e.reply('tiny-notification-create-confirm', { tag, isSupported: Notification.isSupported() });

};

// Module
export default function startNotifications(ipcMain) {

    // Create
    ipcMain.on('tiny-notification-create', (e, data) => {
        if (objType(data, 'object') && typeof data.tag === 'string') {

            // Is Data Cache
            if (data.icon.startsWith('data:image/')) {

                const base64File = data.icon.split(';base64,');
                const ext = base64File[0].split('data:image/')[1];

                const filename = `${data.tag.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
                const tempFile = path.join(tempFolderNoti, `./${filename}`);

                const binaryString = atob(base64File[1]);
                fs.writeFileSync(tempFile, binaryString, 'binary');

                data.iconFile = filename;
                data.icon = tempFile;
                data.iconFromWeb = true;

            } else {
                data.iconFromWeb = false;
            }

            createNotification(e, data);

        }
    });

    // Show
    ipcMain.on('tiny-notification-show', (event, tag) => {
        if (notifications[tag] && typeof notifications[tag].show === 'function') {
            notifications[tag].show();
        }
    });

    // Hide
    ipcMain.on('tiny-notification-close', (event, tag) => {
        if (notifications[tag] && typeof notifications[tag].close === 'function') {
            notifications[tag].close();
        }
    });

};

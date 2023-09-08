import React, { useRef, useEffect, useState } from 'react';
import { client } from '@gradio/client';
import { getHtml } from './gradioLayout';

function GradioEmbed({ agiData }) {

    // Prepare Data
    const embedRef = useRef(null);
    const [app, setApp] = useState(null);
    const [appInfo, setAppInfo] = useState(null);
    const [appError, setAppError] = useState(null);

    useEffect(() => {
        if (!appError) {

            // Error
            const tinyError = (err) => {
                console.error(err);
                setAppError(err);
            };

            // Load App
            if (!app) {
                client(agiData.url).then(newApp => setApp(newApp)).catch(tinyError);
            }

            // Execute Data
            else {

                // Read Template
                const page = getHtml(app);

                // Test
                const embed = $(embedRef.current);

            }

        }
    });

    // Complete
    return <div ref={embedRef} className='mt-2 ratio ratio-16x9 embed-video enabled agi-client-embed'>
        yay
    </div>;

};

export default GradioEmbed;
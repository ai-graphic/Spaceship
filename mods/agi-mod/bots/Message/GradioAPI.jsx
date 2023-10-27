import React, { useRef, useEffect, useState } from 'react';
import { client } from '@gradio/client';
import GradioLayout, { fileUrlGenerator } from './gradioLayout';
import { chatboxScrollToBottom, objType, toast } from '../../../../src/util/tools';
import { setLoadingPage } from '../../../../src/app/templates/client/Loading';
import { getRoomInfo } from '../../../../src/app/organisms/room/Room';
import tinyAPI from '../../../../src/util/mods';
import * as Y from 'yjs';

const updateInputValue = (input, dropdown, value, filePath = '') => {

    if (input.type === 'jquery') {
        if (dropdown && dropdown.type === 'jquery') dropdown.value.val(value);
        input.value.val(value);
    }

    if (input.type === 'blob') {

        const tinyUrl = `${filePath}${typeof value === 'string' ? value.startsWith('/') || !filePath ? value : `/${value}` : ''}`;
        if (!tinyUrl.startsWith('data:')) {

            setLoadingPage('Fetching gladio blob...');
            fetch(tinyUrl)
                .then(response => response.blob())
                .then(blob => {
                    setLoadingPage(false);
                    const reader = new FileReader();
                    reader.onload = function () { input.value(this.result, true); }; // <--- `this.result` contains a base64 data URI
                    reader.readAsDataURL(blob);
                }).catch(err => {
                    setLoadingPage(false);
                    toast(err.message);
                    console.error(err);
                });

        } else {
            input.value(tinyUrl, true);
        }

    }

};

function GradioEmbed({ agiData }) {

    // Prepare Data
    const embedRef = useRef(null);
    const [app, setApp] = useState(null);
    const [appError, setAppError] = useState(null);
    const [crdt, setCrdt] = useState({});

    useEffect(() => {
        if (!appError) {
            try {

                // Error
                const tinyError = (err) => {
                    console.error(err);
                    toast(err.message);
                    setAppError(err);
                };

                // Load App
                if (!app) {
                    client(agiData.url).then(newApp => setApp(newApp)).catch(tinyError);
                }

                // Execute Data
                else {

                    // Insert Embed
                    const embed = $(embedRef.current);
                    if (embed.find('gladio-embed').length < 1 && objType(app, 'object') && objType(app.config, 'object') && typeof app.config.space_id === 'string' && app.config.space_id.length > 0) {

                        // Id
                        const embedCache = {};
                        const id = app.config.space_id.replace('/', '_');
                        const config = app.config;

                        // Data
                        const jsonCache = crdt.ydoc.getText(id);
                        let tinyJson = {};

                        try {
                            tinyJson = JSON.parse(jsonCache.toString());
                        } catch {
                            tinyJson = {};
                        }

                        jsonCache.observe(() => {
                            try {
                                tinyJson = JSON.parse(jsonCache.toString());
                                console.log(tinyJson);
                            } catch {
                                tinyJson = {};
                            }
                        });

                        console.log(tinyJson);

                        setTimeout(() => {
                            // tinyJson.yay = 'yay';
                            // jsonCache.insert(0, JSON.stringify(tinyJson))
                        }, 10000);

                        // Read Template
                        const embedData = new GradioLayout(config, `gradio-embed[space='${id}']`, agiData.url, id, embedCache);
                        const page = $('<gradio-embed>', { class: 'text-center', space: id });
                        embedData.insertHtml(page);
                        chatboxScrollToBottom();
                        embed.append(page);

                        // Send Update
                        const sendTinyUpdate = (index, output, value, outputs, dataset, isSubmit = false) => {

                            if (
                                objType(output, 'object') &&
                                objType(output.data, 'object') &&
                                typeof value !== 'undefined' &&
                                (value || value === null)
                            ) {

                                let tinyValue = value;
                                if (
                                    value === null &&
                                    dataset && (typeof dataset.index === 'string' || typeof dataset.index === 'number') &&
                                    Array.isArray(dataset.props.samples) && Array.isArray(dataset.props.samples[dataset.index]) &&
                                    typeof dataset.props.samples[dataset.index][0] === 'string'
                                ) {
                                    tinyValue = `${fileUrlGenerator(config.root)}${dataset.props.samples[dataset.index][0]}`;
                                }

                                const data = embedData.getComponentValue(output.depId);
                                const input = embedData.getInput(output.depId);
                                const dropdown = embedData.getDropdown(output.depId);
                                if (objType(input, 'object')) {
                                    data.props.value = tinyValue;
                                    updateInputValue(input, dropdown, tinyValue);
                                }

                            }

                            // Insert Database
                            const insertDataset = (tinyIndex, compValue, type, component) => {

                                const data = embedData.getComponentValue(component);
                                const input = embedData.getInput(component);
                                const dropdown = embedData.getDropdown(component);

                                if (objType(input, 'object')) {
                                    data.props.value = compValue;
                                    updateInputValue(input, dropdown, compValue, fileUrlGenerator(config.root));
                                }

                            };

                            // Dataset
                            if (dataset && Array.isArray(dataset.props.samples)) {
                                const sample = dataset.props.samples[dataset.index];
                                if (sample) {

                                    // Using Component Id
                                    if (Array.isArray(dataset.props.component_ids) && dataset.props.component_ids.length > 0) {
                                        for (const tinyIndex in dataset.props.component_ids) {

                                            const compId = dataset.props.component_ids[tinyIndex];
                                            const component = embedData.getComponent(compId);

                                            insertDataset(
                                                tinyIndex,
                                                sample[tinyIndex],
                                                dataset.props.components[tinyIndex],
                                                component
                                            );

                                        }
                                    }

                                    // Plan B
                                    else if (Array.isArray(dataset.props.components) && dataset.props.components.length > 0) {
                                        for (const tinyIndex in dataset.props.components) {

                                            // Get Values
                                            const comp = dataset.props.components[tinyIndex];
                                            const val = sample[tinyIndex];
                                            const component = output.data.value;

                                            // Compare
                                            if (comp === output.data.type) {
                                                insertDataset(
                                                    tinyIndex,
                                                    val,
                                                    comp,
                                                    component
                                                );
                                            }

                                        }
                                    }

                                }
                            }

                            // Output send result
                            if (isSubmit) {

                                const embedValues = embedData.getComponentValue(output.depId);
                                if (objType(embedValues, 'object') && objType(embedValues.props, 'object')) {
                                    if (objType(value, 'object') && objType(value.value, 'object')) {
                                        for (const item in value) {
                                            embedValues.props[item] = value[item];
                                        }
                                    } else {
                                        embedValues.props.value = value;
                                    }
                                }

                                embedData.updateEmbed();
                                // console.log('Tiny Update', index, output, value, outputs, dataset);
                            }

                        };

                        // Submit
                        const tinySubmit = (comps, tinyIndex) => {

                            // Input Values
                            const inputs = [];

                            // Read data
                            for (const index in comps.input) {

                                console.log('Submit test item', comps.input[index]);

                                // jQuery
                                if (comps.input[index].data.type === 'jquery') {
                                    try {

                                        const value = comps.input[index].data.value.val();
                                        if (typeof value === 'string') {
                                            inputs.push(value);
                                        } else {
                                            inputs.push(null);
                                        }

                                    } catch (err) {
                                        console.error(err);
                                        inputs.push(null);
                                    }
                                }

                                // Blob
                                else if (comps.input[index].data.type === 'blob') {
                                    try {

                                        if (typeof comps.input[index].data.value === 'function') {
                                            inputs.push(comps.input[index].data.value());
                                        } else {
                                            inputs.push(null);
                                        }

                                    } catch (err) {
                                        console.error(err);
                                        inputs.push(null);
                                    }
                                }

                                // Array
                                else if (comps.input[index].data.type === 'array') {
                                    if (Array.isArray(comps.input[index].data.value) && comps.input[index].data.value.length > 0) {

                                        const tinyArray = [];

                                        for (const vi in comps.input[index].data.value) {

                                            let value;

                                            try {
                                                if (Array.isArray(comps.input[index].data.value[vi]) && comps.input[index].data.value[vi][0]) {
                                                    if (comps.input[index].data.value[vi][0].is(':checked')) {
                                                        value = comps.input[index].data.value[vi][0].val();
                                                    }
                                                } else if (comps.input[index].data.value[vi]) {
                                                    if (comps.input[index].data.value[vi].is(':checked')) {
                                                        value = comps.input[index].data.value[vi].val();
                                                    }
                                                }
                                            } catch {
                                                value = null;
                                            }

                                            if (typeof value === 'string' && value.length > 0) {
                                                tinyArray.push(value);
                                            }

                                        }

                                        inputs.push(tinyArray);

                                    }
                                }

                                // Others
                                else {
                                    inputs.push(null);
                                    console.log('Input Component', comps.input[index].depId, comps.input[index].data);
                                }

                            }

                            // https://www.gradio.app/docs/js-client#submit
                            const submitName = comps.api_name ? `/${comps.api_name}` : Number(tinyIndex);

                            console.log('Submit test', submitName, comps, inputs);
                            setLoadingPage('Starting gradio...');
                            const job = app.submit(submitName, inputs);

                            // Sockets
                            job.on('data', (data) => {

                                // Convert to momentjs
                                console.log('Data', data);
                                data.time = moment(data.time);

                                // Data
                                if (Array.isArray(data.data) && data.data.length > 0) {
                                    for (const item in data.data) {

                                        const finalResultSend = (tinyData, index) => {

                                            const value =
                                                objType(tinyData, 'object') ?
                                                    typeof tinyData.name === 'string' && tinyData.is_file ? `${fileUrlGenerator(agiData.url)}${tinyData.name}` :
                                                        typeof tinyData.data === 'string' && tinyData.is_file ? tinyData.data :
                                                            objType(tinyData.value, 'object') ? tinyData : null :
                                                    typeof tinyData === 'string' ? tinyData : null;

                                            sendTinyUpdate(
                                                tinyIndex,
                                                comps.output[index],
                                                value,
                                                null,
                                                null,
                                                true
                                            );

                                        };

                                        if (Array.isArray(data.data[item]) && data.data[item].length > 0) {
                                            for (const index in data.data[item]) {
                                                finalResultSend(data.data[item][index], index);
                                            }
                                        } else {
                                            finalResultSend(data.data[item], item);
                                        }

                                    }
                                }

                            });

                            job.on('status', (data) => {

                                // Convert to momentjs
                                data.time = moment(data.time);

                                // Queue
                                if (data.queue) {
                                    setLoadingPage('Queue...');
                                }

                                // Pending
                                if (data.stage === 'pending') {
                                    setLoadingPage('Pending...');
                                }

                                // Complete
                                else if (data.stage === 'complete') {

                                    // Success?
                                    setLoadingPage(false);
                                    if (data.success) {

                                    }

                                }

                                // Error
                                else if (data.stage === 'error') {
                                    setLoadingPage(false);
                                    toast(data.message);
                                    console.error(data.message, data.code);
                                }

                                // Generating
                                else if (data.stage === 'generating') {
                                    setLoadingPage('Generating...');
                                }

                            });

                        };

                        embedCache.genDeps = (item) => {

                            const depItem = config.dependencies[item];
                            const comps = { output: [], input: [], cancel: [] };

                            // Get Js Values
                            if (typeof depItem.js === 'string' && depItem.js.length > 0) {
                                try {

                                    if (depItem.js.startsWith(`() => { window.open(\``) && depItem.js.endsWith(`\`, '_blank') }`)) {
                                        depItem.js = { openUrl: depItem.js.substring(21, depItem.js.length - 14) };
                                    } else {
                                        depItem.js = JSON.parse(depItem.js.trim().replace('() => ', ''));
                                    }

                                } catch (err) {
                                    console.error(err, depItem.js);
                                    depItem.js = null;
                                }
                            } else {
                                depItem.js = null;
                            }

                            // Action Base
                            const tinyAction = function (depId, dataId, outputs) {

                                // Outputs list
                                const dataset = config.components.find(comp => comp.id === depId);
                                for (const index in comps.output) {
                                    sendTinyUpdate(
                                        item,
                                        comps.output[index],
                                        Array.isArray(depItem.js) && typeof depItem.js[index] !== 'undefined' ? depItem.js[index] : null,
                                        outputs,
                                        objType(dataset, 'object') && objType(dataset.props, 'object') ? {
                                            props: dataset.props,
                                            index: Array.isArray(dataset.props.headers) && dataset.props.headers.length > 1 ? dataId - 1 : dataId
                                        } : null,

                                    );
                                }

                                // Cancel Parts
                                for (const index in comps.cancel) {
                                    // console.log('Cancel Component', comps.cancel[index].depId, comps.cancel[index].data);
                                }

                                if (comps.scroll_to_output) {

                                }

                                if (comps.show_progress !== 'hidden') {

                                }

                                if (comps.trigger_only_on_success) {

                                }

                                if (comps.trigger_after) {

                                }

                                if (comps.collects_event_data) {

                                }

                                // Inputs list
                                if (comps.backend_fn) tinySubmit(comps, item);

                            };


                            // Inputs list
                            if (Array.isArray(depItem.inputs) && depItem.inputs.length > 0) {
                                for (const index in depItem.inputs) {
                                    const depId = depItem.inputs[index];
                                    comps.input.push({ depId, data: embedData.getInput(depId) });
                                }
                            }


                            // Outputs list
                            if (Array.isArray(depItem.outputs) && depItem.outputs.length > 0) {
                                for (const index in depItem.outputs) {
                                    const depId = depItem.outputs[index];
                                    comps.output.push({ depId, data: embedData.getComponent(depId) });
                                }
                            }

                            // Cancel Parts
                            if (Array.isArray(depItem.cancels) && depItem.cancels.length > 0) {
                                for (const index in depItem.cancels) {
                                    const depId = depItem.cancels[index];
                                    comps.cancel.push({ depId, data: embedData.getComponent(depId) });
                                }
                            }

                            comps.show_progress = depItem.show_progress;
                            comps.trigger_only_on_success = depItem.trigger_only_on_success;
                            comps.trigger_after = depItem.trigger_after;
                            comps.collects_event_data = depItem.collects_event_data;
                            comps.backend_fn = depItem.backend_fn;

                            const clickAction = (target, type, depId, outputs, triggerAfter) => {
                                console.log('Target', type, target, depId, triggerAfter);
                                if (!triggerAfter) {

                                    const executeArray = (value, targetType, input, targetId) => {

                                        // jQuery
                                        if (targetType === 'jquery') {
                                            value.on(type, () => tinyAction(depId, targetId, outputs));
                                        }

                                        else if (targetType === 'blob') {
                                            input.on('change', () => tinyAction(depId, targetId, outputs));
                                        }

                                        // Array
                                        else if (targetType === 'array') {
                                            for (const item2 in value) {

                                                // Mode 1
                                                if (!Array.isArray(value[item2])) {
                                                    value[item2].on(type, () => tinyAction(depId, item2, outputs));
                                                }

                                                // Mode 2
                                                else {
                                                    for (const item3 in value[item2]) {
                                                        executeArray(value[item2][item3], 'jquery', input, value.length < 2 ? item3 : item2);
                                                    }
                                                }

                                            }
                                        }

                                    };

                                    executeArray(target.value, target.type, target.input);

                                }
                            };

                            // Trigger
                            const trigger = config.dependencies[item].trigger;

                            // Target to execute the action
                            if (Array.isArray(depItem.targets) && depItem.targets.length > 0) {
                                for (const index in depItem.targets) {

                                    // String
                                    if (typeof trigger === 'string') {

                                        // Get Id
                                        const depId = depItem.targets[index];
                                        let target = embedData.getTarget(depId);
                                        if (!target) target = embedData.getInput(depId);
                                        if (target) {

                                            // Click
                                            if (trigger === 'click') {
                                                clickAction(target, 'click', depId, depItem.outputs);
                                            }

                                            // Change
                                            else if (trigger === 'change') {
                                                clickAction(target, 'change', depId, depItem.outputs);
                                            }

                                            // Then
                                            else if (trigger === 'then' || trigger === 'upload' || trigger === 'select') {
                                                console.log(`Input "${trigger}"`, target, depId, depItem.outputs, config.dependencies[item].trigger_after);
                                                clickAction(target, 'change', depId, depItem.outputs, config.dependencies[item].trigger_after);
                                            }

                                        }

                                    }

                                    // Array
                                    else if (Array.isArray(depItem.targets[index]) && depItem.targets[index].length > 0) {
                                        if (typeof depItem.targets[index][0] === 'number' && typeof depItem.targets[index][1] === 'string') {

                                            // Get Id
                                            const depId = depItem.targets[index][0];
                                            let target = embedData.getTarget(depId);
                                            if (!target) target = embedData.getInput(depId);
                                            if (target) {

                                                // Click
                                                if (depItem.targets[index][1] === 'click') {
                                                    clickAction(target, 'click', depId, depItem.outputs);
                                                }

                                                // Change
                                                else if (depItem.targets[index][1] === 'change') {
                                                    clickAction(target, 'change', depId, depItem.outputs);
                                                }

                                                // Then
                                                else if (depItem.targets[index][1] === 'then' || depItem.targets[index][1] === 'upload' || depItem.targets[index][1] === 'select') {
                                                    console.log(`Input "${depItem.targets[index][1]}"`, target, depId, depItem.outputs, config.dependencies[item].trigger_after);
                                                    clickAction(target, 'change', depId, depItem.outputs, config.dependencies[item].trigger_after);
                                                }

                                            }

                                        }
                                    }

                                }
                            }

                        };

                        // Read dependencies
                        if (Array.isArray(config.dependencies) && config.dependencies.length > 0) {
                            for (const item in config.dependencies) {
                                embedCache.genDeps(item);
                            }
                        }

                        console.log(id, config);
                        return () => {
                            if (app && typeof app.destroy === 'function') app.destroy();
                            page.remove();
                        };

                    }

                }

            } catch (err) {
                console.error(err);
                toast(err.message);
            }

            // Set Room CRDT
            const roomInfoUpdate = (data, roomInfo) => {
                if (roomInfo && roomInfo.roomTimeline) {

                    const roomTimeline = roomInfo.roomTimeline;
                    roomTimeline.initProvider();

                    if (crdt.roomId !== roomTimeline.roomId) {
                        setCrdt({
                            roomId: roomTimeline.roomId,
                            ydoc: roomTimeline.getYdoc(),
                            provider: roomTimeline.getProvider(),
                        });
                    }

                }
            };

            roomInfoUpdate(null, getRoomInfo());
            tinyAPI.on('setRoomInfo', roomInfoUpdate);
            return () => {
                tinyAPI.off('setRoomInfo', roomInfoUpdate);
            };

        }
    });

    // Temp result. (I'm using this only to have a preview. This will be removed later.)
    // <iframe title='gradio' src={agiData.url} />
    return <div ref={embedRef} className='mt-2 agi-client-embed chatbox-size-fix border border-bg p-4' />;

};

export default GradioEmbed;
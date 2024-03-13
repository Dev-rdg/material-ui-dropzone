import * as React from 'react';

import {createFileFromUrl, readFile} from '../helpers';

import DropzoneDialogBase from './DropzoneDialogBase';


/**
 * This component provides an uncontrolled version of the DropzoneDialogBase component.
 *
 * It supports all the Props and Methods from `DropzoneDialogBase` but keeps the files state internally.
 *
 * **Note** The `onSave` handler also returns `File[]` with all the accepted files.
 */
class DropzoneDialog extends React.PureComponent {
    state = {
        fileObjects: [],
    }

    componentDidMount() {
        this.loadInitialFiles();
    }

    componentWillUnmount() {
        const {clearOnUnmount} = this.props;

        if (clearOnUnmount) {
            this.setState({
                fileObjects: [],
            }, this.notifyFileChange);
        }
    }

    notifyFileChange = () => {
        const {onChange} = this.props;
        const {fileObjects} = this.state;

        if (onChange) {
            onChange(fileObjects.map((fileObject) => fileObject.file));
        }
    }

    loadInitialFiles = async() => {
        const {initialFiles} = this.props;
        try {
            const fileObjs = await Promise.all(
                initialFiles.map(async(initialFile) => {
                    let file;
                    if (typeof initialFile === 'string' ) {
                        file = await createFileFromUrl(initialFile);
                    } else {
                        file = initialFile;
                    }
                    const data = await readFile(file);

                    return {
                        file,
                        data,
                    };
                })
            );

            this.setState((state) => ({
                fileObjects: [].concat(
                    state.fileObjects,
                    fileObjs
                ),
            }), this.notifyFileChange);
        } catch (err) {
            console.log(err);
        }
    }

    addFiles = async(newFileObjects) => {
        const {filesLimit} = this.props;
        // Update component state
        this.setState((state) => {
            // Handle a single file
            if (filesLimit <= 1) {
                return {
                    fileObjects: [].concat(newFileObjects[0]),
                };
            }

            // Handle multiple files
            return {
                fileObjects: [].concat(
                    state.fileObjects,
                    newFileObjects
                ),
            };
        }, this.notifyFileChange);
    }

    deleteFile = (removedFileObj, removedFileObjIdx) => {
        event.stopPropagation();

        const {onDelete} = this.props;
        const {fileObjects} = this.state;

        // Calculate remaining fileObjects array
        const remainingFileObjs = fileObjects.filter((fileObject, i) => {
            return i !== removedFileObjIdx;
        });

        // Notify removed file
        if (onDelete) {
            onDelete(removedFileObj.file);
        }

        // Update local state
        this.setState({
            fileObjects: remainingFileObjs,
        }, this.notifyFileChange);
    }

    handleClose = (evt) => {
        const {clearOnUnmount, onClose} = this.props;

        if (onClose) {
            onClose(evt);
        }

        if (clearOnUnmount) {
            this.setState({
                fileObjects: [],
            }, this.notifyFileChange);
        }
    }

    handleSave = (evt) => {
        const {clearOnUnmount, onSave} = this.props;
        const {fileObjects} = this.state;

        if (onSave) {
            onSave(fileObjects.map((fileObject) => fileObject.file), evt);
        }

        if (clearOnUnmount) {
            this.setState({
                fileObjects: [],
            }, this.notifyFileChange);
        }
    }

    render() {
        const {fileObjects} = this.state;

        return (
            <DropzoneDialogBase
                {...this.props}
                fileObjects={fileObjects}
                onAdd={this.addFiles}
                onDelete={this.deleteFile}
                onClose={this.handleClose}
                onSave={this.handleSave}
            />
        );
    }
}

DropzoneDialog.defaultProps = {
    clearOnUnmount: true,
    filesLimit: 3,
    initialFiles: [],
};

export default DropzoneDialog;

import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import clsx from 'clsx';
import * as React from 'react';
import {Fragment} from 'react';
import Dropzone from 'react-dropzone';
import {convertBytesToMbsOrKbs, isImage, readFile} from '../helpers';
import PreviewList from './PreviewList';
import SnackbarContentWrapper from './SnackbarContentWrapper';
import {styled} from "@mui/material";

const styles = ({palette, shape, spacing}) => ({
    '@keyframes progress': {
        '0%': {
            backgroundPosition: '0 0',
        },
        '100%': {
            backgroundPosition: '-70px 0',
        },
    },
    root: {
        position: 'relative',
        width: '100%',
        minHeight: '250px',
        backgroundColor: palette.background.paper,
        border: 'dashed',
        borderColor: palette.divider,
        borderRadius: shape.borderRadius,
        boxSizing: 'border-box',
        cursor: 'pointer',
        overflow: 'hidden',
    },
    active: {
        animation: '$progress 2s linear infinite !important',
        // eslint-disable-next-line max-len
        backgroundImage: `repeating-linear-gradient(-45deg, ${palette.background.paper}, ${palette.background.paper} 25px, ${palette.divider} 25px, ${palette.divider} 50px)`,
        backgroundSize: '150% 100%',
        border: 'solid',
        borderColor: palette.primary.light,
    },
    invalid: {
        // eslint-disable-next-line max-len
        backgroundImage: `repeating-linear-gradient(-45deg, ${palette.error.light}, ${palette.error.light} 25px, ${palette.error.dark} 25px, ${palette.error.dark} 50px)`,
        borderColor: palette.error.main,
    },
    textContainer: {
        textAlign: 'center',
    },
    text: {
        marginBottom: spacing(3),
        marginTop: spacing(3),
    },
    icon: {
        width: 51,
        height: 51,
        color: palette.text.primary,
    },
    resetButton: {
        display: 'block',
        margin: '10px 0',
    },
});

const defaultSnackbarAnchorOrigin = {
    horizontal: 'left',
    vertical: 'bottom',
};

const defaultGetPreviewIcon = (fileObject, classes) => {
    if (isImage(fileObject.file)) {
        return (<img
            className={classes.image}
            role="presentation"
            src={fileObject.data}
        />);
    }

    return <AttachFileIcon className={classes.image} />;
};

/**
 * This components creates a Material-UI Dropzone, with previews and snackbar notifications.
 */
class DropzoneAreaBase extends React.PureComponent {
    state = {
        openSnackBar: false,
        snackbarMessage: '',
        snackbarVariant: 'success',
    };

    notifyAlert() {
        const {onAlert} = this.props;
        const {openSnackBar, snackbarMessage, snackbarVariant} = this.state;
        if (openSnackBar && onAlert) {
            onAlert(snackbarMessage, snackbarVariant);
        }
    }

    handleDropAccepted = async(acceptedFiles, evt) => {
        const {fileObjects, filesLimit, getFileAddedMessage, getFileLimitExceedMessage, onAdd, onDrop} = this.props;

        if (filesLimit > 1 && fileObjects.length + acceptedFiles.length > filesLimit) {
            this.setState({
                openSnackBar: true,
                snackbarMessage: getFileLimitExceedMessage(filesLimit),
                snackbarVariant: 'error',
            }, this.notifyAlert);
            return;
        }

        // Notify Drop event
        if (onDrop) {
            onDrop(acceptedFiles, evt);
        }

        // Retrieve fileObjects data
        const fileObjs = await Promise.all(
            acceptedFiles.map(async(file) => {
                const data = await readFile(file);
                return {
                    file,
                    data,
                };
            })
        );

        // Notify added files
        if (onAdd) {
            onAdd(fileObjs);
        }

        // Display message
        const message = fileObjs.reduce((msg, fileObj) => msg + getFileAddedMessage(fileObj.file.name), '');
        this.setState({
            openSnackBar: true,
            snackbarMessage: message,
            snackbarVariant: 'success',
        }, this.notifyAlert);
    }

    handleDropRejected = (rejectedFiles, evt) => {
        const {
            acceptedFiles,
            filesLimit,
            fileObjects,
            getDropRejectMessage,
            getFileLimitExceedMessage,
            maxFileSize,
            onDropRejected,
        } = this.props;

        let message = '';
        if (fileObjects.length + rejectedFiles.length > filesLimit) {
            message = getFileLimitExceedMessage(filesLimit);
        } else {
            rejectedFiles.forEach((rejectedFile) => {
                message = getDropRejectMessage(rejectedFile, acceptedFiles, maxFileSize);
            });
        }

        if (onDropRejected) {
            onDropRejected(rejectedFiles, evt);
        }

        this.setState({
            openSnackBar: true,
            snackbarMessage: message,
            snackbarVariant: 'error',
        }, this.notifyAlert);
    }

    handleRemove = (fileIndex) => (event) => {
        event.stopPropagation();

        const {fileObjects, getFileRemovedMessage, onDelete} = this.props;

        // Find removed fileObject
        const removedFileObj = fileObjects[fileIndex];

        // Notify removed file
        if (onDelete) {
            onDelete(removedFileObj, fileIndex);
        }

        this.setState({
            openSnackBar: true,
            snackbarMessage: getFileRemovedMessage(removedFileObj.file.name),
            snackbarVariant: 'info',
        }, this.notifyAlert);
    };

    handleCloseSnackbar = () => {
        this.setState({
            openSnackBar: false,
        });
    };

    render() {
        const {
            acceptedFiles,
            alertSnackbarProps,
            classes,
            disableRejectionFeedback,
            dropzoneClass,
            dropzoneParagraphClass,
            dropzoneProps,
            dropzoneText,
            fileObjects,
            filesLimit,
            getPreviewIcon,
            Icon,
            inputProps,
            maxFileSize,
            previewChipProps,
            previewGridClasses,
            previewGridProps,
            previewText,
            showAlerts,
            showFileNames,
            showFileNamesInPreview,
            showPreviews,
            showPreviewsInDropzone,
            useChipsForPreview,
            reset,
        } = this.props;
        const {openSnackBar, snackbarMessage, snackbarVariant} = this.state;

        const acceptFiles = acceptedFiles?.join(',');
        const isMultiple = filesLimit > 1;
        const previewsVisible = showPreviews && fileObjects.length > 0;
        const previewsInDropzoneVisible = showPreviewsInDropzone && fileObjects.length > 0;

        return (
            <Fragment>
                <Dropzone
                    {...dropzoneProps}
                    accept={acceptFiles}
                    onDropAccepted={this.handleDropAccepted}
                    onDropRejected={this.handleDropRejected}
                    maxSize={maxFileSize}
                    multiple={isMultiple}
                >
                    {({getRootProps, getInputProps, isDragActive, isDragReject}) => (
                        <div
                            {...getRootProps({
                                className: clsx(
                                    classes.root,
                                    dropzoneClass,
                                    isDragActive && classes.active,
                                    (!disableRejectionFeedback && isDragReject) && classes.invalid,
                                ),
                            })}
                        >
                            <input {...getInputProps(inputProps)} />

                            <div className={classes.textContainer}>
                                <Typography
                                    variant="h5"
                                    component="p"
                                    className={clsx(classes.text, dropzoneParagraphClass)}
                                >
                                    {dropzoneText}
                                </Typography>
                                {Icon ? (
                                    <Icon className={classes.icon} />
                                ) : (
                                    <CloudUploadIcon className={classes.icon} />
                                )}
                            </div>

                            {previewsInDropzoneVisible &&
                                <PreviewList
                                    fileObjects={fileObjects}
                                    handleRemove={this.handleRemove}
                                    getPreviewIcon={getPreviewIcon}
                                    showFileNames={showFileNames}
                                    useChipsForPreview={useChipsForPreview}
                                    previewChipProps={previewChipProps}
                                    previewGridClasses={previewGridClasses}
                                    previewGridProps={previewGridProps}
                                />
                            }
                        </div>
                    )}
                </Dropzone>

                {
                    reset && (
                        React.isValidElement(reset) ?
                            reset :
                            <Button
                                onClick={reset.onClick}
                                variant="outlined"
                                className={classes.resetButton}
                            >
                                {reset.text || 'reset'}
                            </Button>
                    )
                }

                {previewsVisible &&
                    <Fragment>
                        <Typography variant="subtitle1" component="span">
                            {previewText}
                        </Typography>

                        <PreviewList
                            fileObjects={fileObjects}
                            handleRemove={this.handleRemove}
                            getPreviewIcon={getPreviewIcon}
                            showFileNames={showFileNamesInPreview}
                            useChipsForPreview={useChipsForPreview}
                            previewChipProps={previewChipProps}
                            previewGridClasses={previewGridClasses}
                            previewGridProps={previewGridProps}
                        />
                    </Fragment>
                }

                {((typeof showAlerts === 'boolean' && showAlerts) ||
                    (Array.isArray(showAlerts) && showAlerts.includes(snackbarVariant))) &&
                    <Snackbar
                        anchorOrigin={defaultSnackbarAnchorOrigin}
                        autoHideDuration={6000}
                        {...alertSnackbarProps}
                        open={openSnackBar}
                        onClose={this.handleCloseSnackbar}
                    >
                        <SnackbarContentWrapper
                            onClose={this.handleCloseSnackbar}
                            variant={snackbarVariant}
                            message={snackbarMessage}
                        />
                    </Snackbar>
                }
            </Fragment>
        );
    }
}

DropzoneAreaBase.defaultProps = {
    acceptedFiles: [],
    filesLimit: 3,
    fileObjects: [],
    maxFileSize: 3000000,
    dropzoneText: 'Drag and drop a file here or click',
    previewText: 'Preview:',
    disableRejectionFeedback: false,
    showPreviews: false, // By default previews show up under in the dialog and inside in the standalone
    showPreviewsInDropzone: true,
    showFileNames: false,
    showFileNamesInPreview: false,
    useChipsForPreview: false,
    previewChipProps: {},
    previewGridClasses: {},
    previewGridProps: {},
    reset: undefined,
    showAlerts: true,
    alertSnackbarProps: {
        anchorOrigin: {
            horizontal: 'left',
            vertical: 'bottom',
        },
        autoHideDuration: 6000,
    },
    getFileLimitExceedMessage: (filesLimit) => (`Maximum allowed number of files exceeded. Only ${filesLimit} allowed`),
    getFileAddedMessage: (fileName) => (`File ${fileName} successfully added.`),
    getPreviewIcon: defaultGetPreviewIcon,
    getFileRemovedMessage: (fileName) => (`File ${fileName} removed.`),
    getDropRejectMessage: (rejectedFile, acceptedFiles, maxFileSize) => {
        let message = `File ${rejectedFile.name} was rejected. `;
        if (!acceptedFiles.includes(rejectedFile.type)) {
            message += 'File type not supported. ';
        }
        if (rejectedFile.size > maxFileSize) {
            message += 'File is too big. Size limit is ' + convertBytesToMbsOrKbs(maxFileSize) + '. ';
        }
        return message;
    },
};

export default styled(DropzoneAreaBase)(styles);

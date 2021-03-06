import React, { useState, useRef } from 'react';
// import Dialog from '@material-ui/core/Dialog';
// import useMediaQuery from '@material-ui/core/useMediaQuery';
import {
  withStyles, Popover, TextField, InputAdornment,
} from '@material-ui/core';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import Grid from '@material-ui/core/Grid';
import Slider from '@material-ui/core/Slider';
import VolumeDown from '@material-ui/icons/VolumeDown';
import VolumeUp from '@material-ui/icons/VolumeUp';

import { useRegisterForPipe, useIsPiped, useUnpipeAction } from 'utils/useSoundSyncState';
import { nameWithoutHiddenMeta, isHidden } from 'utils/hiddenUtils';
import { AudioSink } from '../../../../src/audio/sinks/audio_sink';

const EditPopover = withStyles((t) => ({
  paper: {
    backgroundColor: 'rgba(0,0,0,.4)',
    backdropFilter: 'blur(2px)',
    borderRadius: 5,
    color: 'white',
    padding: t.spacing(2, 3),
    width: 300,
  },
}))(Popover);

const PopoverButton = withStyles((t) => ({
  root: {
    display: 'block',
    textAlign: 'center',
    margin: t.spacing(1, 0),
    width: '100%',
    backgroundColor: 'rgba(0,0,0,.6)',
    color: 'white',
  },
}))(Button);

const PopoverTextField = withStyles(() => ({
  input: {
    color: 'white',
  },
}))(({ classes, InputProps, ...props }) => (<TextField {...props} InputProps={{ classes, ...InputProps }} />));

export const SinkContextMenu = ({
  isOpen, onClose, sink, anchor,
}: { sink: AudioSink; isOpen: boolean; onClose: () => any; anchor: HTMLElement }) => {
  const [renameOpen, setRenameOpen] = useState(false);

  const inputEl = useRef<HTMLInputElement>();
  const hidden = isHidden(sink.name);

  const handleClose = () => {
    onClose();
    // because of popover close animation
    setTimeout(() => {
      setRenameOpen(false);
    }, 500);
  };

  const handleRenameButtonClick = () => setRenameOpen(true);
  const handleRename = async () => {
    const newName = inputEl.current.value;
    if (newName !== nameWithoutHiddenMeta(sink.name)) {
      sink.patch({ name: hidden ? `[hidden] ${newName}` : newName });
    }
    handleClose();
  };

  const handleHide = async () => {
    const newName = hidden ? nameWithoutHiddenMeta(sink.name) : `[hidden] ${sink.name}`;
    // await edit(type, audioStream.uuid, { name: newName });
    sink.patch({ name: newName });
    handleClose();
  };

  const registerForPipe = useRegisterForPipe('sink', sink)[2];

  const handleLink = () => {
    handleClose();
    registerForPipe();
  };

  const handleUnpipe = useUnpipeAction(sink);
  const handleUnlink = () => {
    handleUnpipe();
    handleClose();
  };

  const isPiped = useIsPiped(sink.uuid);

  const renameInputAdornment = (
    <InputAdornment position="end">
      <IconButton
        aria-label="Rename source"
        onClick={handleRename}
        style={{ color: 'white' }}
      >
        <EditIcon />
      </IconButton>
    </InputAdornment>
  );

  const renameModalContent = (
    <PopoverTextField
      defaultValue={nameWithoutHiddenMeta(sink.name)}
      fullWidth
      InputProps={{
        inputRef: inputEl,
        autoFocus: true,
        endAdornment: renameInputAdornment,
      }}
    />
  );

  const handleVolumeChange = (e, newValue) => {
    sink.patch({
      volume: newValue,
    });
  };

  const defaultModalContent = (
    <>
      <Grid container spacing={2}>
        <Grid item>
          <VolumeDown />
        </Grid>
        <Grid item xs>
          <Slider value={sink.volume} min={0} max={1} step={0.01} onChange={handleVolumeChange} aria-labelledby="continuous-slider" />
        </Grid>
        <Grid item>
          <VolumeUp />
        </Grid>
      </Grid>
      <PopoverButton disableElevation variant="contained" onClick={handleLink}>Link</PopoverButton>
      {isPiped && <PopoverButton disableElevation variant="contained" onClick={handleUnlink}>Unlink</PopoverButton>}
      <PopoverButton disableElevation variant="contained" onClick={handleRenameButtonClick}>Rename</PopoverButton>
      <PopoverButton disableElevation variant="contained" onClick={handleHide}>{hidden ? 'Unhide' : 'Hide'}</PopoverButton>
      {window.localStorage.getItem('soundsync:debug') && <PopoverButton disableElevation variant="contained" onClick={() => console.log(sink)}>Log info</PopoverButton>}
    </>
  );

  return (
    <EditPopover
      anchorEl={anchor}
      open={isOpen}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'center',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      {renameOpen && renameModalContent}
      {!renameOpen && defaultModalContent}
    </EditPopover>
  );
};

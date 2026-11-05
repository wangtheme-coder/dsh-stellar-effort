import React from 'react';
import { EffortChip, EffortDock, SettingsEntry, installStyle } from './ui.jsx';
import { VisualPreferences, hostPreferences } from './preferences.mjs';
import { Diagnostics } from './diagnostics.mjs';

export const inject = ['slots', 'modelDirectories', 'sessions', 'remote', 'remote.session'];
export function apply(ctx) {
  const style=installStyle();
  const runtime={preferences:new VisualPreferences(hostPreferences()),diagnostics:new Diagnostics()};
  void runtime.preferences.load();
  ctx.effect(()=>()=>{style.remove();return runtime.preferences.dispose();},'stellar-effort: visual lifecycle');
  ctx.slots.inject('conversation.input.right',()=>ctx.slots.register({
    name:'conversation.input.right',id:'dsh-stellar-effort',order:45,
    inject:sessionId=>({directory:ctx.modelDirectories.directoryFor(sessionId),available:ctx.sessions.subagentAddress(sessionId)===undefined})
  },props=><EffortChip key={props.directory.sessionId} directory={props.directory} available={props.available} runtime={runtime}/>));
  // Resident compact rail in the dock above the composer.
  ctx.slots.inject('conversation.input.dock',()=>ctx.slots.register({
    name:'conversation.input.dock',id:'dsh-stellar-effort',order:30,
    inject:sessionId=>({directory:ctx.modelDirectories.directoryFor(sessionId),available:ctx.sessions.subagentAddress(sessionId)===undefined})
  },props=><EffortDock key={props.directory.sessionId} directory={props.directory} available={props.available} runtime={runtime}/>));
  ctx.slots.inject('settings.section',()=>ctx.slots.register({name:'settings.section',id:'stellar-effort',order:65,label:'星轨推理'},props=> <SettingsEntry runtime={runtime} onClose={props.close}/>));
}


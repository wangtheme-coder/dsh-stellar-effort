// Synchronous, read-only view of the existing controller after an input callback.
// Keep recoverable pointer escape distinct from invalidated gestures.
import {nearestLevel} from '../shared/mapping.mjs';
export function visualValidity(controller,expected) {
 const state=controller.getSnapshot(),gesture=controller.gesture;
 const valid=!!gesture&&!controller.disposed&&!state.disabled&&state.phase==='preview'&&!gesture.conflict&&gesture.epoch===controller.epoch&&gesture.fingerprint===state.fingerprint&&(!expected||gesture===expected);
 return {valid,cancelZone:valid&&state.cancelZone,identity:gesture,position:state.actual?.position??0,epoch:controller.epoch};
}
export function acceptedVisualPending(controller,evolution,epoch){
 const state=controller.getSnapshot(),pending=controller.pending;
 return !!pending&&!!evolution&&state.phase==='applying'&&!state.disabled&&pending.fingerprint===state.fingerprint&&pending.target.reasoningEffort===nearestLevel(state.levels,evolution.position)?.id&&(controller.epoch===epoch||state.actual?.id===pending.target.reasoningEffort);
}

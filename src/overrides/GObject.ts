// deno-lint-ignore-file no-explicit-any
import { GConnectFlags } from "../bindings/enums.js";
import g from "../bindings/mod.js";
import { createCallback } from "../types/callback.js";

type Handler = (...args: unknown[]) => unknown;

function addObjectMethods(object: any) {
  object.prototype.connect = function (
    action: string,
    callback: Handler,
  ) {
    const signalInfo = Reflect.getMetadata(
      "gi:signals",
      this.constructor,
      action.split("::")[0],
    );

    const cb = createCallback(signalInfo, callback, this);
    const handler = g.signal.connect_data(
      Reflect.getOwnMetadata("gi:ref", this),
      action,
      cb.pointer,
      null,
      null,
      GConnectFlags.SWAPPED,
    );

    return handler;
  };

  object.prototype.on = function (
    action: string,
    callback: Handler,
  ) {
    return this.connect(action, callback);
  };

  object.prototype.once = function (
    action: string,
    callback: Handler,
  ) {
    const handler = this.connect(action, (...args: unknown[]) => {
      callback(...args);
      this.disconnect(handler);
    });

    return handler;
  };

  object.prototype.off = function (handler: Handler) {
    g.signal.handler_disconnect(
      Reflect.getOwnMetadata("gi:ref", this),
      handler as any,
    );
  };

  object.prototype.emit = function (action: string) {
    g.signal.emit_by_name(
      Reflect.getOwnMetadata("gi:ref", this),
      action,
    );
  };
}

export function _init(GObject: any) {
  addObjectMethods(GObject.Object);
}

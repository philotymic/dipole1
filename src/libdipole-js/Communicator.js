
function generateQuickGuid() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

class Communicator {
    constructor(server_url) {
	this.server_url = server_url;
	this.pending_calls = new Map();
	this.deliver_response = this.deliver_response.bind(this);
    }

    connect() {
	return new Promise((resolve, reject) => {
	    this.socket = new WebSocket(this.server_url);

	    this.socket.onopen = (e) => {
		console.log("[open] Connection established");
		resolve(this);
	    };

	    this.socket.onerror = function(error) {
		console.log(`[error] ${error.message}`);
		reject(error);
	    }

	    this.socket.onmessage = (event) => {
		//console.log(`from server: ${event.data}`);	    
		this.deliver_response(JSON.parse(event.data));
	    };

	    this.socket.onclose = function(event) {
		if (event.wasClean) {
		    console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
		} else {
		    // e.g. server process killed or network down
		    // event.code is usually 1006 in this case
		    console.log('[close] Connection died');
		}
	    };
	});
    }
    
    deliver_response(res) {
	let call_id = res['call_id'];
	console.log("deliver_response, call_id:", res['call_id']);
	let call_obj = this.pending_calls.get(call_id);
	this.pending_calls.delete(call_id);
	let [resolve, reject] = call_obj['promise_cbs'];
	resolve(res['call_return']);
	// or reject(res) if res is actually remote exception
    }
    
    do_call(args) {
	return new Promise((resolve, reject) => {
	    if (this.pending_calls.size > 1) {
		console.error("this.pending_calls is too big");
	    }
	    args = {...args, 'call_id': generateQuickGuid()};
	    let pending_call_args = {...args, 'promise_cbs': [resolve, reject]};
	    this.pending_calls.set(pending_call_args['call_id'], pending_call_args);

	    let call_message = JSON.stringify({'action': 'remote-call', 'action-args': args});
	    console.log("socket.send, call_id:", args['call_id']);
	    this.socket.send(call_message)
	});
    };
};

export default Communicator;
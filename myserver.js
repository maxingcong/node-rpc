const grpc = require('@grpc/grpc-js');//引入grpc
const protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = __dirname + '/my.proto'    //定义.proto文件的路径，我的.proto文件在根目录下，所以写成这样

const myProto = protoLoader.loadSync(PROTO_PATH, {
    // keepCase: true,
    // longs: String,
    // enums: String,
    // defaults: true,
    // oneofs: true
})
const hello_proto = grpc.loadPackageDefinition(myProto).helloworld; // myProto 是定义的变量，接受grpc加载的给定路径下的服务，helloworld是proto中定义的 
// package myservices;


var sum = 0;    //定义了一个变量用于计数，客户端每次访问+1，并返回这个计数
const getAsset = (res, callback) => {    //定义一个getAsset方法
    // console.log(res.request.name);
    callback(null, { message: (sum++).toString() });
}


// 服务端流式调用
function serverStream(call) {
    console.log(call.request);
    call.write({ message: '服务端响应1' });
    call.write({ message: '服务端响应2' });
    call.end()
}

// 客户端流式调用
function clientStream(call, callback) {
    call.on('error', function (e) {
        console.log('error  ', e)
    });
    call.on('status', function (status) {
        console.log('status status ', status)
    });

    call.on('data', function (point) {
        console.log(point);
    });
    call.on('end', function () {//客户端发送结束接受数据
        callback(null, { message: "发送结束" });
        console.log('结束');
    });

}


// 客户端服务端双向流
function doubleStream(call, callback) {
    console.log('call.request', call.request);
    console.log('callback', callback);
    /******服务端接收***********/
    call.on('error', function (e) {
        console.log('error  ', e)
    });
    call.on('status', function (status) {
        console.log('status status ', status)
    });

    call.on('data', function (point) {
        console.log(point);
    });
    call.on('end', function () {//客户端发送结束接受数据
        console.log('结束');
    });

    /******服务端发送***********/
    call.write({ message: '服务端发送1' });
    call.write({ message: '服务端发送2' });
    call.end()
}




async function main() {
    var server = new grpc.Server(); //创建一个grpc的服务
    //将方法加入到grpc的服务中            //前面一个getAsset指的是上面定义的getAsset方法，后面一个getAsset指的是my.proto中注册的rpc方法
    server.addService(hello_proto.Greeter.service, {
        mSimple: getAsset,
        mServer: serverStream,
        mClient: clientStream,
        mDouble: doubleStream
    });
    await new Promise((resolve, reject) => {
        //讲服务绑定端口，这里绑定的是本机的50051端口，这个端口可以自行修改
        server.bindAsync(
            `localhost:50051`,
            grpc.ServerCredentials.createInsecure(),
            (err, result) => (err ? reject(err) : resolve(result))
        );
    });

    server.start();
    // 显示是否启动成功
    console.log(server.started);
}

main();


// const server = new grpc.Server();

// server.addProtoService(myProto.assetService.service, { getAsset: getAsset })


// server.bind('127.0.0.1:17041', grpc.ServerCredentials.createInsecure())

// server.start();
//服务启动
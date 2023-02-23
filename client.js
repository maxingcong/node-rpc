const PROTO_PATH = __dirname + '/my.proto';

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });

const hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

function main() {

    const client = new hello_proto.Greeter('localhost:50051', grpc.credentials.createInsecure());

    /******一般测试***********/
    // client.mSimple({ name: '你好客户端发起' }, function (err, response) {
    //     console.log('服务端响应:', response);
    // });

    /******测试服务端流式调用***********/
    // const call = client.mServer({ name: '客户端发起: 测试服务端流式调用' });
    // call.on('error', function (e) {
    //     console.log('error  ', e)
    // });
    // call.on('status', function (status) {
    //     console.log('status status ', status)
    // });

    // call.on('data', function (feature) {
    //     console.log('on data ', feature)
    // });
    // call.on('end', function () {
    //     console.log('end end ')
    // });


    /******测试客户端端流式调用***********/
    // const call = client.mClient((error, stats) => { // 客户端流式调用会有一个回调函数存在
    //     console.log(error, stats);
    // });
    // call.write({ name: '测试1' });
    // call.write({ name: '测试2' });
    // call.end()


    /******测试客户端服务端双向流***********/
    const call = client.mDouble();//不接受数据
    //客户端发送
    call.write({ name: '测试1' });
    call.write({ name: '测试2' });
    //客户端接受
    call.on('error', function (e) {
        console.log('error  ', e)
    });
    call.on('status', function (status) {
        console.log('status status ', status)
    });

    call.on('data', function (feature) {
        console.log('on data ', feature)
    });
    call.on('end', function () {
        console.log('end end ')
    });

    call.end()
}

main();
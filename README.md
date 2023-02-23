# node中使用 grpc

#### 1、创建node_grpc 目录 npm init &&  npm i `@grpc/grpc-js`, `@grpc/proto-loader`, `google-protobuf`, `grpc-tools`

node grpc  已被弃用，官方推荐 `@grpc/grpc-js`
新建 client.js 和 server.ts  分别存放[grpc](https://so.csdn.net/so/search?q=grpc&spm=1001.2101.3001.7020)的客户端和服务端方便自测调用

#### 2、定义protobuf的文件.proto

proto3 文档  https://protobuf.dev/programming-guides/proto3/
这篇博客 也不错 https://blog.csdn.net/iTheoChan/article/details/113102772

或者参考go  https://www.topgoer.com/%E5%BE%AE%E6%9C%8D%E5%8A%A1/gRPC/Protobuf%E8%AF%AD%E6%B3%95.html

```
syntax = "proto3"; //指定协议版本

package helloworld;

service Greeter { //定义服务名
  // 简单gRPC调用
  rpc mSimple (HelloRequest) returns (HelloReply) {}
  //声明一个方法，使用rpc 关键字声明一个mSimple 方法，该方法需要传入参数 HelloRequest,会返回一个结果HelloReply

  // 服务端流式调用
  rpc mServer (HelloRequest) returns (stream HelloReply) {}

  // 客户端流式调用
  rpc mClient (stream HelloRequest) returns (HelloReply) {}

  // 客户端服务端双向流
  rpc mDouble (stream HelloRequest) returns (stream HelloReply) {}
}

message HelloRequest {//声明方法中参数的类型
  string name = 1;
}

message HelloReply {//声明返回结果的类型
  string message = 1;
}

```

#### 3、定义server 端

```
const grpc = require('@grpc/grpc-js');//引入grpc
const protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = __dirname + '/my.proto'    //定义.proto文件的路径，我的.proto文件在根目录下，所以写成这样

const myProto = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
})
const hello_proto = grpc.loadPackageDefinition(myProto).helloworld; // myProto 是定义的变量，接受grpc加载的给定路径下的服务，helloworld是proto中定义的 
// package myservices;


var sum = 0;    //定义了一个变量用于计数，客户端每次访问+1，并返回这个计数
const getAsset = (call, callback) => {    //定义一个getAsset方法
    callback(null, { message: (sum++).toString() });
}


async function main() {
    var server = new grpc.Server(); //创建一个grpc的服务
    //将方法加入到grpc的服务中            //前面一个getAsset指的是上面定义的getAsset方法，后面一个getAsset指的是my.proto中注册的rpc方法
    server.addService(hello_proto.Greeter.service, { sayHelloSimple: getAsset });
    await new Promise((resolve, reject) => {
        //讲服务绑定端口，这里绑定的是本机的17041端口，这个端口可以自行修改
        server.bindAsync(
            `0.0.0.0:50051`,
            grpc.ServerCredentials.createInsecure(),
            (err, result) => (err ? reject(err) : resolve(result))
        );
    });

    server.start();
    // 显示是否启动成功
    console.log(server.started);
}

main();



// server.start();
//服务启动
```

#### 4、客户端

```
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
    var client = new hello_proto.Greeter('0.0.0.0:50051', grpc.credentials.createInsecure());
    client.mSimple({ name: 'World, Eden!!!' }, function (err, response) {
        console.log('Greeting:', response.message);
    });
}

main();
```

#### 5、启动

```
启动结果
 >>node myserver.js
true
```

```
>>> node client.js
Greeting: 0
>>> node client.js
Greeting: 1
>>> node client.js
Greeting: 2
```

#### 6、说明

1. **简单gRPC调用** ：客户端通过clien 发起请求，等待服务端 `callback()`返回结果，就像本地调用一样
2. **服务端流式调用** ：客户端发起一次请求，服务端不是返回一个结果，而是将一组结果通过流 `call()`返回
3. **客户端流式调用** ：客户端发起一组请求 `write()`,`on()`，服务端等到客户端所有请求发送完毕，接收到客户端的 `end()`调用，此时服务端 `callback()`发送一次结果给客户端
4. **客户端服务端双向流** ：客户端和服务端双向流互不干预，可各种按照自己的顺序消费处理，比如服务端可以选择每次接受客户端一个请求就 `write()`,`on()`返回一个结果，也可以选择等客户端所有请求发送完毕收到客户端的 `end()`调用再把所有的返回结果一次性 `call()`返回给客户端

#import "WebsocketSelfSigned.h"
#import <React/RCTEventEmitter.h>
#import "WebsocketSelfSigned-Swift.h"

@implementation WebsocketSelfSigned {
  WebSocketWithSelfSignedCertManager *_manager;
  int _listenerCount;
}

RCT_EXPORT_MODULE(WebsocketSelfSigned);

- (instancetype)init {
  if (self = [super init]) {

    _manager = [WebSocketWithSelfSignedCertManager new];

    __weak __typeof(self) weakSelf = self;

    [_manager setCallbacksWithOnOpen:^(NSString *url) {
        [weakSelf emit:@"onOpen" body:@{@"url": url}];
    } onMessage:^(NSString *url, NSString *msg) {
        [weakSelf emit:@"onMessage" body:@{@"url": url, @"message": msg}];
    } onBinaryMessage:^(NSString *url, NSString *b64) {
        [weakSelf emit:@"onBinaryMessage" body:@{@"url": url, @"message": b64}];
    } onClose:^(NSString *url) {
        [weakSelf emit:@"onClose" body:@{@"url": url}];
    } onError:^(NSString *url, NSString *err) {
        [weakSelf emit:@"onError" body:@{@"url": url, @"error": err}];
    }];
  }
  return self;
}

#pragma mark - Event Emitter

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onOpen", @"onMessage", @"onBinaryMessage", @"onClose", @"onError"];
}

- (void)startObserving { _listenerCount = 1; }
- (void)stopObserving { _listenerCount = 0; }

- (void)emit:(NSString *)eventName body:(NSDictionary *)body {
  if (_listenerCount > 0) {
    [self sendEventWithName:eventName body:body];
  }
}

#pragma mark - TurboModule SPEC METHODS


- (void)addListener:(NSString *)eventName {
  [super addListener:eventName];
  _listenerCount += 1;
}

- (void)removeListeners:(double)count {
  [super removeListeners:count];
  _listenerCount -= (int)count;
  if (_listenerCount < 0) _listenerCount = 0;
}

// connect
- (void)connect:(NSString *)url
        headers:(NSDictionary *)headers
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject
{
  [_manager connect:url headers:headers completion:^(NSString *ok, NSError *err) {
    if (err) {
      reject(@"ConnectError", err.localizedDescription, err);
      return;
    }
    resolve(ok);
  }];
}

// send
- (void)send:(NSString *)url message:(NSString *)message {
  [_manager send:url message:message];
}

// sendBinaryBase64
- (void)sendBinaryBase64:(NSString *)url base64String:(NSString *)base64String {
  [_manager sendBinaryBase64:url base64String:base64String];
}

// close
- (void)close:(NSString *)url {
  [_manager close:url];
}

#pragma mark - TurboModule JSI bridge
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeWebsocketSelfSignedSpecJSI>(params);
}

@end

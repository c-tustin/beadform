#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>
int main(int argc, const char **argv) { @autoreleasepool {
    if (argc != 3) return 2;
    NSError *error = nil;
    NSString *source = [NSString stringWithContentsOfFile:@(argv[1]) encoding:NSUTF8StringEncoding error:&error];
    NSString *recipe = [NSString stringWithContentsOfFile:@(argv[2]) encoding:NSUTF8StringEncoding error:&error];
    if (!source || !recipe) return 2;
    JSContext *ctx = [JSContext new];
    [ctx evaluateScript:source];
    if (ctx.exception) { NSLog(@"%@",ctx.exception); return 1; }
    NSString *json = [[ctx[@"mobileCompile"] callWithArguments:@[recipe]] toString];
    if (ctx.exception) { NSLog(@"%@",ctx.exception); return 1; }
    NSDictionary *pattern = [NSJSONSerialization JSONObjectWithData:[json dataUsingEncoding:NSUTF8StringEncoding] options:0 error:&error];
    if ([pattern[@"beadPositions"] count] != 18 || [pattern[@"steps"] count] != 4) return 1;
    puts("Apple JavaScriptCore compiled the native Qwen recipe into 18 beads and four steps.");
    return 0;
} }

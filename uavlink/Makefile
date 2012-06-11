all:
	node-waf configure
	node-waf build

run: all
	node test.js

clean:
	rm -fr build

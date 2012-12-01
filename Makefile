
all: clean build

build: lib/otis.js bin/otis

clean:
	@rm lib/otis.js
	@rm bin/otis

lib/otis.js:
	@coffee -c -o ./lib src/otis.coffee

bin/otis:
	@coffee -c -o ./bin src/otis-bin.coffee
	@echo "#!/usr/bin/env node\n\n" > ./bin/otis
	@cat ./bin/otis-bin.js >> ./bin/otis
	@rm ./bin/otis-bin.js



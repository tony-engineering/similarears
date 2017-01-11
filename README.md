Similarears is a web application using Soundcloud API to find people with the same musical tastes as you.

# INSTALLATION & LAUNCH #
- Download repo as zip and extract it
- Download and install redis, on windows : https://github.com/MSOpenTech/redis/releases
- Launch redis on 127.0.0.1:6379 (default parameters)
- Type "npm install" in root directory
- Type "npm start" to start server

# USE SIMILAREARS #
- Similarears uses bee-queue to manage requests queuing. You can monitor it on this url once the server is started : http://localhost:9000/bee-queue-ui
- You can get similar Soundcloud users for a profile by following these steps :
1. Select the target Soundcloud profile. For this example we will use : http://soundcloud.com/xtonex
2. Go to http://localhost:3000/calculation/get-all-data?url=http://soundcloud.com/xtonex . This will launch the profile's scrapping.
3. The generated file for the specified profile will appear in the root directory. This file contains the list of favoriters for each track the given profile liked on Soundcloud. The process is not automated yet so you have to launch file analysis manually. See below.
4. Go to http://localhost:3000/calculation/analyse-data?filename=<filename_generated>.json

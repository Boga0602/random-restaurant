window.onload = function () {
    const randomButton = document.getElementById('random-button');
    randomButton.addEventListener('click', getRandomRestaurant);
};
function initMap() {
    // 初始化地圖
    const map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15, // 初始縮放級別
    });

    // 獲取當前位置的座標
    navigator.geolocation.getCurrentPosition(function (position) {
        const currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
        };

        // 將地圖中心設置為當前位置
        map.setCenter(currentPosition);

        // 在地圖上添加標記，標記表示當前位置
        new google.maps.Marker({
            position: currentPosition,
            map: map,
            title: '您的位置',
        });
    });
}
let selectedRestaurants = [];

function getRandomRestaurant() {
    navigator.geolocation.getCurrentPosition(function (position) {
        const currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        const map = new google.maps.Map(document.getElementById('map'), {
            center: currentPosition,
            zoom: 15
        });

        const service = new google.maps.places.PlacesService(map);

        const request = {
            location: currentPosition,
            radius: 5000,
            type: ['restaurant', 'cafe', 'bar', 'food', 'fast_food', 'street_food','餐廳','咖啡廳','酒吧', '熟食店', '速食店', '美食廣場', '夜市', '小吃攤','街邊小吃', '冰淇淋店', '甜品店', '面店', '漢堡店', '披薩店', '壽司店', '拉麵店', '火鍋店', '燒烤店', '海鮮餐廳', '素食餐廳', '異國料理','台式料理','中國菜', '台灣菜', '日本料理', '韓國料理', '泰國料理', '印度料理', '墨西哥料理', '義大利料理'],
            keyword: '食物 美食 外帶 內用 午餐 晚餐 菜單',
            openNow: true,
        };

        service.nearbySearch(request, function (results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                // 過濾評分高於4顆星且未選取過的餐廳
                const highRatedRestaurants = results.filter(function (place) {
                    return (
                        place.rating >= 4 &&
                        place.user_ratings_total > 50 &&
                        !selectedRestaurants.includes(place.place_id)
                    );
                });

                if (highRatedRestaurants.length > 0) {
                    const randomIndex = Math.floor(Math.random() * highRatedRestaurants.length);
                    const randomPlace = highRatedRestaurants[randomIndex];

                    selectedRestaurants.push(randomPlace.place_id);

                    service.getDetails({ placeId: randomPlace.place_id }, function (place, status) {
                        if (status === google.maps.places.PlacesServiceStatus.OK) {
                            const infowindow = new google.maps.InfoWindow({
                                content: `
                                    <h3>${place.name}</h3>
                                    <p>地址：${place.formatted_address}</p>
                                    <p>電話：${place.formatted_phone_number}</p>
                                    <p>評分：${place.rating}顆星 (${place.user_ratings_total}個評分)</p>
                                    <p>營業時間：${getOpeningHoursString(place.opening_hours)}</p>
                                    <p>開車時間：待計算</p>
                                `
                            });

                            const marker = new google.maps.Marker({
                                position: place.geometry.location,
                                map: map
                            });

                            infowindow.open(map, marker);

                            const directionsService = new google.maps.DirectionsService();
                            const directionsDisplay = new google.maps.DirectionsRenderer({
                                map: map
                            });

                            directionsService.route({
                                origin: currentPosition,
                                destination: place.geometry.location,
                                travelMode: 'DRIVING'
                            }, function (response, status) {
                                if (status === 'OK') {
                                    directionsDisplay.setDirections(response);
                                    const route = response.routes[0];
                                    let durationText = '';
                                    if (route.legs && route.legs[0] && route.legs[0].duration && route.legs[0].duration.text) {
                                        durationText = route.legs[0].duration.text;
                                    }
                                    infowindow.setContent(infowindow.getContent().replace('待計算', durationText));
                                }
                            });
                        }
                    });
                } else {
                    // 沒有評分高於4顆星的餐廳或所有餐廳都已選取過
                    alert('附近沒有可選取的餐廳');
                }
            }
        });
    });
}

function getOpeningHoursString(openingHours) {
    let openingHoursString = '';
    if (openingHours) {
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const today = new Date().getDay();
        const currentHours = new Date().getHours();
        const currentMinutes = new Date().getMinutes();
        const currentTime = currentHours * 100 + currentMinutes;
        const periods = openingHours.periods;

        if (periods) {
            const todayPeriods = periods.filter(function (period) {
                return period.open.day === today;
            });

            if (todayPeriods.length > 0) {
                const openingHoursList = todayPeriods.map(function (period) {
                    const openTime = parseInt(period.open.time);
                    const closeTime = parseInt(period.close.time);
                    const isOpenNow = openTime <= currentTime && currentTime <= closeTime;
                    const timeString = `${formatTime(period.open.time)} - ${formatTime(period.close.time)}`;
                    return `${timeString}${isOpenNow ? ' (營業中)' : ''}`;
                });

                const dayString = weekdays[today];
                openingHoursString = `<p>${dayString}: ${openingHoursList.join(', ')}</p>`;
            }
        }
    }

    return openingHoursString;
}


function formatTime(time) {
    const hours = time.slice(0, 2);
    const minutes = time.slice(2);
    return `${hours}:${minutes}`;
}

function isOpenTime(time) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 100 + currentMinute;

    return currentTime >= parseInt(time);
}

function isClosedTime(time) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 100 + currentMinute;

    return currentTime > parseInt(time);
}

function getTimeRangeString(startTime, endTime) {
    const startHour = startTime.slice(0, 2);
    const startMinute = startTime.slice(2);
    const endHour = endTime.slice(0, 2);
    const endMinute = endTime.slice(2);

    return `${startHour}:${startMinute} - ${endHour}:${endMinute}`;
}
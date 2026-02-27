import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Loader2, MapPin } from 'lucide-react';
import styles from './WeatherWidget.module.css';

interface WeatherData {
    temperature: number;
    weatherCode: number;
    city: string;
}

const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun size={48} className={styles.sun} />;
    if (code >= 1 && code <= 3) return <Cloud size={48} className={styles.cloud} />;
    if (code >= 45 && code <= 48) return <Cloud size={48} className={styles.fog} />;
    if (code >= 51 && code <= 67) return <CloudRain size={48} className={styles.rain} />;
    if (code >= 71 && code <= 77) return <CloudSnow size={48} className={styles.snow} />;
    if (code >= 80 && code <= 82) return <CloudRain size={48} className={styles.rain} />;
    if (code >= 85 && code <= 86) return <CloudSnow size={48} className={styles.snow} />;
    if (code >= 95 && code <= 99) return <CloudLightning size={48} className={styles.storm} />;
    return <Sun size={48} />;
};

const getWeatherDescription = (code: number) => {
    if (code === 0) return 'Clear sky';
    if (code >= 1 && code <= 3) return 'Partly cloudy';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Rainy';
    if (code >= 71 && code <= 77) return 'Snowy';
    if (code >= 80 && code <= 82) return 'Heavy Rain';
    if (code >= 85 && code <= 86) return 'Snow Showers';
    if (code >= 95 && code <= 99) return 'Thunderstorm';
    return 'Unknown';
};

export const WeatherWidget: React.FC = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = async (lat: number, lon: number, cityName: string) => {
            try {
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
                );
                const data = await response.json();

                setWeather({
                    temperature: data.current.temperature_2m,
                    weatherCode: data.current.weather_code,
                    city: cityName
                });
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch weather');
                setLoading(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeather(position.coords.latitude, position.coords.longitude, 'My Location');
                },
                () => {
                    fetchWeather(51.5074, -0.1278, 'London');
                }
            );
        } else {
            fetchWeather(51.5074, -0.1278, 'London');
        }
    }, []);

    if (loading) {
        return (
            <div className={styles.center}>
                <Loader2 className={styles.spinner} />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.center}>
                <p className={styles.error}>{error}</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.mainInfo}>
                <div className={styles.iconWrapper}>
                    {weather && getWeatherIcon(weather.weatherCode)}
                </div>
                <div className={styles.temp}>
                    {weather?.temperature}°C
                </div>
            </div>
            <div className={styles.details}>
                <div className={styles.condition}>
                    {weather && getWeatherDescription(weather.weatherCode)}
                </div>
                <div className={styles.location}>
                    <MapPin size={14} />
                    {weather?.city}
                </div>
            </div>
        </div>
    );
};

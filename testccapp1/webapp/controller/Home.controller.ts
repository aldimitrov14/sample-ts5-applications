import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import Fragment from "sap/ui/core/Fragment";
import Grid from "sap/ui/layout/Grid"; 
import Control from "sap/ui/core/Control";
import DateFormat from "sap/ui/core/format/DateFormat";
import Input from "sap/m/Input";

interface WeatherData {
    latitude: number;
    longitude: number;
    daily: string;
    timezone: string;
    start_date: string;
    end_date: string;
    name: string;
}

interface CardData {
    name: string;
    time: string;
    maximumTemp: number;
    minimumTemp: number;
}

/**
 * @namespace testccapp1.controller
 */
export default class Home extends Controller {

    /*eslint-disable @typescript-eslint/no-empty-function*/

    private fragment: Control | Control[];

    public  onInit(): void {
    }

    public async loadWeather(): Promise<void> {
        const grid = this.byId("weatherGrid") as Grid;

        grid.destroyContent();
        grid.removeAllContent();

        const input = this.byId("cityInput") as Input;

        const city = await this.getCityData(input.getValue());

        const oDateFormat = DateFormat.getDateInstance({ pattern: "YYYY-MM-dd" });

        const cardData = await this.getCardData({
            latitude: city.latitude,
            longitude: city.longitude,
            start_date: oDateFormat.format(new Date()),
            end_date: oDateFormat.format(new Date(new Date().setDate(new Date().getDate() + 4))),
            daily: "temperature_2m_min,temperature_2m_max",
            timezone: "Europe/Berlin",
            name: city.name
        });

        const cardDataModel = new JSONModel(cardData);

        await this.initCardFragmentGlobal();

        this.createWeatherCards(cardData, this.fragment, cardDataModel, grid);
    }

    private async initCardFragmentGlobal() {
        if (!this.fragment) {
            this.fragment = await this.loadWeatherCardFragment();
        }
    }

    private async getCardData(weatherData: WeatherData) {
        const apiData = await this.callWeatherAPI(weatherData);

        const cardData = this.createCardData(apiData, weatherData.name);
        return cardData;
    }

    private async getCityData(input: string) {
        const cityData = await this.callCityAPI(input);
        return cityData?.results?.[0] ?? null;
    }

    private createWeatherCards(cardData: CardData[], fragment: Control | Control[], cardDataModel: JSONModel, grid: Grid) {

        for (var i = 0; i < cardData.length; i++) {

            const weatherCard = this.createWeatherCard(fragment, cardDataModel, i);

            grid.addContent(weatherCard);
        }
    }

    private createWeatherCard(fragment: any, cardDataModel: JSONModel, i: number) {
        const cloneFragment = fragment.clone();

        cloneFragment.setModel(cardDataModel, "cardData");

        cloneFragment.bindElement(`cardData>/${i}`);
        return cloneFragment;
    }

    private async loadWeatherCardFragment() {
        return await Fragment.load({
            name: "testccapp1.view.fragments.WeatherCard",
            type: "XML",
            controller: this
        });
    }

    private async callWeatherAPI(weatherData: WeatherData): Promise<any>{
        const baseUrl = "https://api.open-meteo.com/v1/forecast";

        const queryParams = new URLSearchParams({
            latitude: weatherData.latitude.toString(),
            longitude:  weatherData.longitude.toString(),
            daily: weatherData.daily,
            timezone:  weatherData.timezone,
            start_date:  weatherData.start_date,
            end_date:  weatherData.end_date
        });

        const apiUrl = `${baseUrl}?${queryParams.toString()}`;

        const jsonModel = new JSONModel();

        try {
    
            await jsonModel.loadData(apiUrl);

            return jsonModel.getData();

        } catch (error) {
            console.error("Error loading weather data:", error);
        }
    }

    private async callCityAPI(cityName: string): Promise<any>{
        const baseUrl = "https://geocoding-api.open-meteo.com/v1/search/";

        const queryParams = new URLSearchParams({
            name: cityName
        });

        const apiUrl = `${baseUrl}?${queryParams.toString()}`;

        const jsonModel = new JSONModel();

        try {
    
            await jsonModel.loadData(apiUrl);

            return jsonModel.getData();

        } catch (error) {
            console.error("Error loading weather data:", error);
        }
    }

    private createCardData(data: any, name: string): CardData[] {
        const cardData: CardData[] = [];

        for (var i = 0; i < data.daily.time.length; i++) {
            cardData.push({
                name: name,
                time: data.daily.time[i],
                maximumTemp: data.daily.temperature_2m_max[i],
                minimumTemp: data.daily.temperature_2m_min[i]
            });
        }

        return cardData;
    }
}
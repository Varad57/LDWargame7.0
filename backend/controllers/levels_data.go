package controllers

type levelSecret struct {
	Flag   string // The flag the player must find while playing this level
	Points int    // Points awarded for completing this level
}

var levelSecrets = []levelSecret{

	{Flag: "WLUG{97d26544be8dc42bf311e85f43d9057f10f30126da020d509cd62acb5699f3b5}", Points: 0}, //0
	{Flag: "WLUG{a0949b3667ab1303a2b98218198d1a164f37c19db86244dc8ba06b328f512347}", Points: 100}, //1
	{Flag: "WLUG{3cc50f29599f77f82546050fa44924ffef09162fd55f46c9c08f93224f36f831}", Points: 200}, //2
	{Flag: "WLUG{59ee5c1cecb8117377c3418ff0fa3cf90174ec1b0fc8bd6aebf740ff7df6aa42}", Points: 300}, //3
	{Flag: "WLUG{ed77e4c38167f08fa09ec47ceb9348537fdbd231cca6d395b057891fd6f8c9f2}", Points: 350}, //4
	{Flag: "WLUG{7d4282af28f80a4ca1ffacf9fd8b30ec19af43e33ad2d34b438aebc1d74019f7}", Points: 400}, //5
	{Flag: "WLUG{141bb505a5ff630c00f1490cf018ae82fefa2d8547319a2fb5bcfc8de9cab151}", Points: 500}, //6
	{Flag: "WLUG{74633a2572a65bce3ca6346be26a17d0f53b00a62797e3b8d84816c3329b7d78}", Points: 550}, //7
	{Flag: "WLUG{441092001df12c482055b05a7f387d33dde5e54a2042ceba94d68e5a98113a9a}", Points: 500}, //8
	{Flag: "WLUG{464f6d16a3cb01b85139539cdc93b48a2112273249e4c338e619a0f19f1a3460}", Points: 600}, //9
	{Flag: "bhargav", Points: 700}, //10
}

// TotalLevels is the number of levels in the game.
const TotalLevels = 11

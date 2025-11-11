module 0x0::batch_distribute {

    use std::vector;
    use sui::tx_context::{TxContext, sender};
    use sui::coin::{Coin, split};
    use sui::transfer::public_transfer;
    use sui::sui::SUI;

    /// O usuário deve passar uma Coin<SUI> grande o suficiente para cobrir todos os envios.
    /// amounts em MIST (1 SUI = 1_000_000_000)
    public entry fun distribute(
        mut main_coin: Coin<SUI>,
        recipients: vector<address>,
        amounts: vector<u64>,
        ctx: &mut TxContext
    ) {
        let len = vector::length(&recipients);
        assert!(len == vector::length(&amounts), 0);

        let mut i = 0;
        while (i < len) {
            let amount = *vector::borrow(&amounts, i);
            let recipient = *vector::borrow(&recipients, i);

            // Divide a coin principal
            let part: Coin<SUI> = split(&mut main_coin, amount, ctx);

            // Envia para o destinatário
            public_transfer(part, recipient);

            i = i + 1;
        };

        // devolve o troco ao remetente
        public_transfer(main_coin, sender(ctx));
    }
}
